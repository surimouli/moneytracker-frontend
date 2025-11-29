from flask import Blueprint, render_template, request, redirect, url_for, flash, session

from models import db, Transaction, Category
from decorators import login_required

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/transactions", methods=["GET", "POST"])
@login_required
def transactions_view():
    user_id = session["user_id"]

    if request.method == "POST":
        # Raw amount string and form fields
        amount_str = request.form.get("amount", "").strip()
        tx_type = request.form.get("type", "income")  # "income" or "spending"
        category_name = request.form.get("category", "").strip()
        note = request.form.get("note", "").strip()

        # Validate amount
        try:
            amount = float(amount_str)
        except ValueError:
            flash("Please enter a valid number for amount.", "danger")
            return redirect(url_for("transactions.transactions_view"))

        # 🔁 Assign sign based on toggle:
        # Income  → positive
        # Spending → negative
        if tx_type == "income":
            amount = abs(amount)   # ensure positive
        else:
            amount = -abs(amount)  # ensure negative

        if not category_name:
            category_name = "Uncategorized"

        # Save transaction
        new_tx = Transaction(
            amount=amount,
            category=category_name,
            note=note,
            user_id=user_id,
        )
        db.session.add(new_tx)
        db.session.commit()
        flash("Transaction added!", "success")
        return redirect(url_for("transactions.transactions_view"))

    # GET: just show form + categories (no recent list here anymore)
    categories = (
        Category.query.filter_by(user_id=user_id)
        .order_by(Category.name)
        .all()
    )

    return render_template(
        "transactions.html",
        categories=categories,
    )