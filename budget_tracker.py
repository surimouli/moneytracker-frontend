import csv
import os
from collections import defaultdict
from datetime import datetime

DATA_FILE = "transactions.csv"


def load_transactions():
    transactions = []
    if not os.path.exists(DATA_FILE):
        return transactions

    with open(DATA_FILE, mode="r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert amount back to float
            try:
                row["amount"] = float(row["amount"])
            except ValueError:
                continue
            transactions.append(row)
    return transactions


def save_transactions(transactions):
    fieldnames = ["date", "amount", "category", "note"]
    with open(DATA_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for t in transactions:
            writer.writerow(t)


def add_transaction(transactions):
    print("\n--- Add a new transaction ---")
    while True:
        amount_str = input("Amount (positive for expense, negative for income): ").strip()
        try:
            amount = float(amount_str)
            break
        except ValueError:
            print("❌ Please enter a valid number.")

    category = input("Category (Food, Rent, Travel, etc.): ").strip()
    if not category:
        category = "Uncategorized"

    note = input("Optional note: ").strip()

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    transaction = {
        "date": now,
        "amount": amount,
        "category": category,
        "note": note
    }

    transactions.append(transaction)
    save_transactions(transactions)
    print("✅ Transaction saved!")


def show_all_transactions(transactions):
    if not transactions:
        print("\nNo transactions yet.")
        return

    print("\n--- All Transactions ---")
    for i, t in enumerate(transactions, start=1):
        print(f"{i}. {t['date']} | {t['category']} | ${t['amount']:.2f} | {t['note']}")


def show_summary(transactions):
    if not transactions:
        print("\nNo data to summarize.")
        return

    print("\n--- Summary ---")
    total = 0.0
    by_category = defaultdict(float)

    for t in transactions:
        amt = t["amount"]
        total += amt
        by_category[t["category"]] += amt

    print(f"Total (all): ${total:.2f}\n")
    print("By Category:")
    for cat, amt in by_category.items():
        print(f"  - {cat}: ${amt:.2f}")


def show_menu():
    print("\n========== Budget Tracker ==========")
    print("1. Add transaction")
    print("2. View all transactions")
    print("3. View summary")
    print("4. Quit")
    return input("Choose an option (1–4): ").strip()


def main():
    print("💰 Welcome to the Budget Tracker!")
    transactions = load_transactions()

    while True:
        choice = show_menu()

        if choice == "1":
            add_transaction(transactions)
        elif choice == "2":
            show_all_transactions(transactions)
        elif choice == "3":
            show_summary(transactions)
        elif choice == "4":
            print("Goodbye! 👋")
            break
        else:
            print("❌ Invalid choice. Try again.")


if __name__ == "__main__":
    main()