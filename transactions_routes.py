from flask import Blueprint, render_template, request, redirect, url_for, flash, session

from app import db, Transaction, Category, login_required

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/transactions", methods=["GET", "POST"])
@login_required
def transactions_view():
    user_id = session["user_id"]

    if request.method == "POST":
        amount_str = request.form.get("amount", "").strip()
        category_name = request.form.get("category", "").strip()
        note = request.form.get("note", "").strip()

        try:
            amount = float(amount_str)
        except ValueError:
            flash("Please enter a valid number for amount.", "danger")
        else:
            if not category_name:
                category_name = "Uncategorized"

            new_tx = Transaction(
                amount=amount,           # positive = spend, negative = income
                category=category_name,
                note=note,
                user_id=user_id,
            )
            db.session.add(new_tx)
            db.session.commit()
            flash("Transaction added!", "success")
            return redirect(url_for("transactions.transactions_view"))

    # categories for dropdown (user-specific)
    categories = Category.query.filter_by(user_id=user_id).order_by(Category.name).all()

    # 5 most recent transactions
    recent = (
        Transaction.query.filter_by(user_id=user_id)
        .order_by(Transaction.date.desc())
        .limit(5)
        .all()
    )

    total = sum(t.amount for t in recent)

    return render_template(
        "transactions.html",
        categories=categories,
        recent=recent,
        total=total,
    )