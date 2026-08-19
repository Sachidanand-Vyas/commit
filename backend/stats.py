from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from models import db, Habit, HabitLog

stats_bp = Blueprint('stats', __name__)


def calculate_streak(habit_logs):
    """
    Calculate overall BUILD activity streak.

    A day counts toward the streak if the user completed
    at least one BUILD habit on that day.
    """

    if not habit_logs:
        return 0, 0

    completed_dates = sorted(
        set(
            log.date
            for log in habit_logs
            if log.completed
        ),
        reverse=True
    )

    if not completed_dates:
        return 0, 0

    today = date.today()

    # Current streak
    current_streak = 0

    # If there is no BUILD activity today, the current streak is 0.
    if completed_dates[0] == today:
        expected_date = today

        for d in completed_dates:
            if d == expected_date:
                current_streak += 1
                expected_date -= timedelta(days=1)
            elif d < expected_date:
                break

    # Best streak
    best_streak = 1
    temp_streak = 1

    ascending_dates = sorted(completed_dates)

    for i in range(1, len(ascending_dates)):
        if ascending_dates[i] == ascending_dates[i - 1] + timedelta(days=1):
            temp_streak += 1
        else:
            best_streak = max(best_streak, temp_streak)
            temp_streak = 1

    best_streak = max(best_streak, temp_streak, current_streak)

    return current_streak, best_streak


@stats_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    user_id = int(get_jwt_identity())
    today_date = date.today()

    # Get ALL user's habits.
    # We need inactive habits too when calculating historical data.
    all_habits = Habit.query.filter_by(user_id=user_id).all()

    build_habits = [
        habit for habit in all_habits
        if habit.habit_type == 'build' and habit.is_active
    ]

    kill_habits = [
        habit for habit in all_habits
        if habit.habit_type == 'kill' and habit.is_active
    ]

    # Get ALL logs for historical statistics.
    all_logs = HabitLog.query.filter_by(user_id=user_id).all()

    # ---------------------------------------------------------
    # BUILD LOGS
    # ---------------------------------------------------------

    build_habit_ids = {
        habit.id
        for habit in all_habits
        if habit.habit_type == 'build'
    }

    build_logs = [
        log
        for log in all_logs
        if log.habit_id in build_habit_ids and log.completed
    ]

    # Number of actual BUILD completions.
    total_build_completions = len(build_logs)

    # Number of days where at least one BUILD activity happened.
    build_active_days = len(
        set(log.date for log in build_logs)
    )

    # Streak is based on days with at least one BUILD activity.
    current_streak, best_streak = calculate_streak(build_logs)

    # ---------------------------------------------------------
    # TODAY
    # ---------------------------------------------------------

    today_build_count = 0
    today_kill_count = 0

    # BUILD
    for habit in build_habits:
        log = HabitLog.query.filter_by(
            habit_id=habit.id,
            user_id=user_id,
            date=today_date
        ).first()

        if log and log.completed:
            today_build_count += 1

    # KILL
    # completed=True means the user slipped.
    for habit in kill_habits:
        log = HabitLog.query.filter_by(
            habit_id=habit.id,
            user_id=user_id,
            date=today_date
        ).first()

        if log and log.completed:
            today_kill_count += 1

    return jsonify({
        'total_completions': total_build_completions,
        'active_days': build_active_days,
        'current_streak': current_streak,
        'best_streak': best_streak,
        'today_build_count': today_build_count,
        'today_kill_count': today_kill_count,
    }), 200


@stats_bp.route('/contributions', methods=['GET'])
@jwt_required()
def get_contributions():
    """
    Return separate BUILD and KILL contribution data.

    BUILD:
        completed=True = one BUILD activity.

    KILL:
        completed=True = one KILL slip.

    IMPORTANT:
    Historical logs are included even if the habit is currently inactive.
    This prevents historical contribution data from disappearing when
    a habit is deactivated.
    """

    user_id = int(get_jwt_identity())

    # Get ALL habits, including inactive ones.
    habits = Habit.query.filter_by(user_id=user_id).all()

    build_ids = {
        habit.id
        for habit in habits
        if habit.habit_type == 'build'
    }

    kill_ids = {
        habit.id
        for habit in habits
        if habit.habit_type == 'kill'
    }

    # Get all logs belonging to this user.
    logs = HabitLog.query.filter_by(user_id=user_id).all()

    build_result = {}
    kill_result = {}

    for log in logs:

        date_string = log.date.isoformat()

        # BUILD contribution
        if log.habit_id in build_ids and log.completed:
            build_result[date_string] = (
                build_result.get(date_string, 0) + 1
            )

        # KILL contribution
        if log.habit_id in kill_ids and log.completed:
            kill_result[date_string] = (
                kill_result.get(date_string, 0) + 1
            )

    return jsonify({
        'build': build_result,
        'kill': kill_result,
    }), 200


@stats_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly():
    user_id = int(get_jwt_identity())

    month_str = request.args.get('month')

    # ---------------------------------------------------------
    # DETERMINE MONTH
    # ---------------------------------------------------------

    if month_str:
        try:
            month_date = datetime.strptime(
                month_str,
                '%Y-%m'
            )
        except ValueError:
            return jsonify({
                'error': 'Invalid month format. Use YYYY-MM'
            }), 400
    else:
        month_date = datetime.now()

    month_start = date(
        month_date.year,
        month_date.month,
        1
    )

    month_end = (
        month_start +
        relativedelta(months=1)
    ) - timedelta(days=1)

    prev_month_start = (
        month_start -
        relativedelta(months=1)
    )

    prev_month_end = month_start - timedelta(days=1)

    # ---------------------------------------------------------
    # HABITS
    # ---------------------------------------------------------

    habits = Habit.query.filter_by(
        user_id=user_id
    ).all()

    # ---------------------------------------------------------
    # BUILD / KILL LOGS FOR CURRENT MONTH
    # ---------------------------------------------------------

    current_logs = HabitLog.query.filter(
        HabitLog.user_id == user_id,
        HabitLog.date >= month_start,
        HabitLog.date <= month_end
    ).all()

    build_logs = []
    kill_logs = []

    for log in current_logs:

        habit = next(
            (h for h in habits if h.id == log.habit_id),
            None
        )

        if not habit:
            continue

        if habit.habit_type == 'build':
            build_logs.append(log)

        elif habit.habit_type == 'kill':
            kill_logs.append(log)

    # ---------------------------------------------------------
    # BUILD STATISTICS
    # ---------------------------------------------------------

    build_completions = [
        log for log in build_logs
        if log.completed
    ]

    total_build_completions = len(build_completions)

    build_active_days = len(
        set(log.date for log in build_completions)
    )

    # ---------------------------------------------------------
    # KILL STATISTICS
    # ---------------------------------------------------------

    kill_slips = [
        log for log in kill_logs
        if log.completed
    ]

    total_kill_slips = len(kill_slips)

    kill_slip_days = len(
        set(log.date for log in kill_slips)
    )

    # Days in the month
    days_in_month = (month_end - month_start).days + 1

    # Clean days = days where there were no KILL slips.
    clean_days = days_in_month - kill_slip_days

    # KILL consistency represents percentage of clean days.
    kill_consistency = round(
        (clean_days / days_in_month) * 100
    ) if days_in_month > 0 else 0

    # ---------------------------------------------------------
    # BUILD HABIT DATA
    # ---------------------------------------------------------

    habits_data = []

    for habit in habits:

        logs = [
            log for log in current_logs
            if log.habit_id == habit.id
        ]

        completions = sum(
            1
            for log in logs
            if log.completed
        )

        # Calculate approximate number of weeks represented
        # by this month.
        weeks_in_month = days_in_month / 7

        possible = round(
            habit.target_frequency * weeks_in_month
        )

        consistency = round(
            (completions / possible) * 100
        ) if possible > 0 else 0

        # Cap at 100%.
        consistency = min(consistency, 100)

        habits_data.append({
            'id': habit.id,
            'name': habit.name,
            'habit_type': habit.habit_type,
            'target_frequency': habit.target_frequency,
            'completions': completions,
            'possible': possible,
            'consistency': consistency,
        })

    # ---------------------------------------------------------
    # BUILD CONSISTENCY
    # ---------------------------------------------------------

    build_habit_stats = [
        habit_data
        for habit_data in habits_data
        if habit_data['habit_type'] == 'build'
    ]

    if build_habit_stats:
        build_consistency = round(
            sum(
                h['consistency']
                for h in build_habit_stats
            ) / len(build_habit_stats)
        )
    else:
        build_consistency = 0

    # ---------------------------------------------------------
    # BEST BUILD DAY
    # ---------------------------------------------------------

    build_day_counts = {}

    for log in build_completions:

        day_string = log.date.isoformat()

        build_day_counts[day_string] = (
            build_day_counts.get(day_string, 0) + 1
        )

    best_day = None

    if build_day_counts:
        best_day_string = max(
            build_day_counts,
            key=build_day_counts.get
        )

        best_day = datetime.strptime(
            best_day_string,
            '%Y-%m-%d'
        ).strftime('%b %d')

    # ---------------------------------------------------------
    # PREVIOUS MONTH
    # ---------------------------------------------------------

    prev_logs = HabitLog.query.filter(
        HabitLog.user_id == user_id,
        HabitLog.date >= prev_month_start,
        HabitLog.date <= prev_month_end
    ).all()

    prev_build_logs = []

    for log in prev_logs:

        habit = next(
            (h for h in habits if h.id == log.habit_id),
            None
        )

        if habit and habit.habit_type == 'build' and log.completed:
            prev_build_logs.append(log)

    prev_active_days = len(
        set(log.date for log in prev_build_logs)
    )

    return jsonify({
        'build_consistency': build_consistency,
        'kill_consistency': kill_consistency,

        'active_days': build_active_days,

        'total_completions': total_build_completions,

        'total_kill_slips': total_kill_slips,
        'clean_days': clean_days,

        'best_day': best_day,

        'habits': habits_data,

        'prev_month': True,

        'active_days_change': (
            build_active_days - prev_active_days
        ),

        # We aren't calculating historical percentage change
        # yet because that needs a more precise comparison model.
        'build_consistency_change': 0,
    }), 200