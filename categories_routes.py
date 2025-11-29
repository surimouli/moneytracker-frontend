from flask import Blueprint, render_template, request, redirect, url_for, flash, session

from app import db, Category, login_required

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/categories", methods=["GET", "POST"])
@login_required
def categories_view():
    user_id = session["user_id"]

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        if not name:
            flash("Category name cannot be empty.", "danger")
        else:
            existing = Category.query.filter_by(user_id=user_id, name=name).first()
            if existing:
                flash("You already have a category with that name.", "warning")
            else:
                new_cat = Category(name=name, user_id=user_id)
                db.session.add(new_cat)
                db.session.commit()
                flash("Category added!", "success")
        return redirect(url_for("categories.categories_view"))

    categories = Category.query.filter_by(user_id=user_id).order_by(Category.name).all()
    return render_template("categories.html", categories=categories)


@categories_bp.route("/categories/<int:cat_id>/delete", methods=["POST"])
@login_required
def delete_category(cat_id):
    user_id = session["user_id"]
    cat = Category.query.filter_by(id=cat_id, user_id=user_id).first()
    if not cat:
        flash("Category not found.", "danger")
    else:
        db.session.delete(cat)
        db.session.commit()
        flash("Category deleted.", "info")
    return redirect(url_for("categories.categories_view"))