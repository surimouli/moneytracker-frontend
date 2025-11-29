from flask import Flask, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from functools import wraps
import os

app = Flask(__name__)

# 🔐 Secret for sessions (change & keep out of Git in real life)
app.secret_key = "change_this_to_a_random_secret_string"

# 📦 SQLite DB config
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "app.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ---------- MODELS ----------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    transactions = db.relationship("Transaction", backref="user", lazy=True)
    categories = db.relationship("Category", backref="user", lazy=True)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(80), nullable=False, default="Uncategorized")
    note = db.Column(db.String(255), nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("name", "user_id", name="uq_category_name_user"),
    )


# Create tables if not exist
with app.app_context():
    db.create_all()


# ---------- HELPERS ----------

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)

    return decorated_function


@app.context_processor
def inject_user():
    # available in all templates as {{ current_user }}
    return {"current_user": session.get("username")}


# Root route → redirect to Transactions tab
@app.route("/")
def home():
    return redirect(url_for("transactions.transactions_view"))


# ---------- BLUEPRINT REGISTRATION ----------

from auth_routes import auth_bp
from transactions_routes import transactions_bp
from categories_routes import categories_bp
from history_routes import history_bp

app.register_blueprint(auth_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(history_bp)


if __name__ == "__main__":
    app.run(debug=True)