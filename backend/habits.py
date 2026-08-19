from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from models import db, Habit, HabitLog

habits_bp = Blueprint('habits', __name__)


@habits_bp.route('', methods=['GET'])
@jwt_required()
def get_habits():
    user_id = int(get_jwt_identity())
    habits = Habit.query.filter_by(user_id=user_id).order_by(Habit.created_at.desc()).all()
    return jsonify([h.to_dict() for h in habits]), 200


@habits_bp.route('', methods=['POST'])
@jwt_required()
def create_habit():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get('name'):
        return jsonify({'error': 'Habit name is required'}), 400

    if data.get('habit_type') not in ('build', 'kill'):
        return jsonify({'error': 'Habit type must be build or kill'}), 400

    habit = Habit(
        user_id=user_id,
        name=data['name'],
        habit_type=data['habit_type'],
        target_frequency=data.get('target_frequency', 7),
        target_amount=data.get('target_amount'),
    )
    db.session.add(habit)
    db.session.commit()

    return jsonify(habit.to_dict()), 201


@habits_bp.route('/<int:habit_id>', methods=['GET'])
@jwt_required()
def get_habit(habit_id):
    user_id = int(get_jwt_identity())
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first_or_404()
    return jsonify(habit.to_dict()), 200


@habits_bp.route('/<int:habit_id>', methods=['PUT'])
@jwt_required()
def update_habit(habit_id):
    user_id = int(get_jwt_identity())
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first_or_404()
    data = request.get_json()

    if 'name' in data:
        habit.name = data['name']
    if 'habit_type' in data and data['habit_type'] in ('build', 'kill'):
        habit.habit_type = data['habit_type']
    if 'target_frequency' in data:
        habit.target_frequency = data['target_frequency']
    if 'target_amount' in data:
        habit.target_amount = data['target_amount']
    if 'is_active' in data:
        habit.is_active = data['is_active']

    db.session.commit()
    return jsonify(habit.to_dict()), 200


@habits_bp.route('/<int:habit_id>', methods=['DELETE'])
@jwt_required()
def delete_habit(habit_id):
    user_id = int(get_jwt_identity())
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first_or_404()
    db.session.delete(habit)
    db.session.commit()
    return jsonify({'message': 'Habit deleted'}), 200


@habits_bp.route('/<int:habit_id>/logs', methods=['GET'])
@jwt_required()
def get_habit_logs(habit_id):
    user_id = int(get_jwt_identity())
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first_or_404()

    date_str = request.args.get('date')
    if date_str:
        log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        logs = HabitLog.query.filter_by(
            habit_id=habit_id, user_id=user_id, date=log_date
        ).all()
    else:
        logs = HabitLog.query.filter_by(
            habit_id=habit_id, user_id=user_id
        ).order_by(HabitLog.date.desc()).limit(365).all()

    return jsonify([l.to_dict() for l in logs]), 200


@habits_bp.route('/<int:habit_id>/logs', methods=['POST'])
@jwt_required()
def create_or_update_log(habit_id):
    user_id = int(get_jwt_identity())
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first_or_404()
    data = request.get_json()

    if not data or 'date' not in data or 'completed' not in data:
        return jsonify({'error': 'Date and completed status are required'}), 400

    log_date = datetime.strptime(data['date'], '%Y-%m-%d').date()

    existing_log = HabitLog.query.filter_by(
        habit_id=habit_id, user_id=user_id, date=log_date
    ).first()

    if existing_log:
        existing_log.completed = data['completed']
        db.session.commit()
        return jsonify(existing_log.to_dict()), 200
    else:
        log = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            date=log_date,
            completed=data['completed'],
        )
        db.session.add(log)
        db.session.commit()
        return jsonify(log.to_dict()), 201
