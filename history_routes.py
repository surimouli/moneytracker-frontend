from flask import Blueprint, render_template, session, redirect, url_for, flash

from models import db, Transaction
from decorators import login_required

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


@history_bp.route("/history/<int:tx_id>/delete", methods=["POST"])
@login_required
def delete_transaction(tx_id):
    user_id = session["user_id"]
    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()

    if not tx:
        flash("Transaction not found or not yours.", "danger")
    else:
        db.session.delete(tx)
        db.session.commit()
        flash("Transaction deleted.", "info")

    return redirect(url_for("history.history_view"))