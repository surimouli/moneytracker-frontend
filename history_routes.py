from flask import Blueprint, render_template, session

from app import Transaction, login_required

history_bp = Blueprint("history", __name__)


@history_bp.route("/history")
@login_required
def history_view():
    user_id = session["user_id"]
    transactions = (
        Transaction.query.filter_by(user_id=user_id)
        .order_by(Transaction.date.desc())
        .all()
    )
    return render_template("history.html", transactions=transactions)