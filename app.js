const DATA_KEY = "brokeBuddyData";
const USER_KEY = "brokeBuddyUser";


const defaultData = {
    budget: 10000,
    expenses: [],

    goal: {
        name: "",
        target: 0,
        saved: 0
    }
};


let currentUser = "";
let data = structuredClone(defaultData);


/* ================= DATA ================= */


function getUserDataKey(name) {
    return "brokeBuddyData_user_" +
        encodeURIComponent(name.trim().toLowerCase());
}

function loadData(userName) {
    const userKey = getUserDataKey(userName);
    let saved = localStorage.getItem(userKey);

    // Preserve existing data for the first user who migrates it
    if (!saved) {
        const oldData = localStorage.getItem(DATA_KEY);

        if (oldData) {
            saved = oldData;
            localStorage.setItem(userKey, oldData);
            localStorage.removeItem(DATA_KEY);
        }
    }

    if (!saved) {
        return structuredClone(defaultData);
    }

    try {
        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,
            expenses: Array.isArray(parsed.expenses)
                ? parsed.expenses
                : [],
            goal: {
                ...defaultData.goal,
                ...(parsed.goal || {})
            }
        };
    } catch {
        localStorage.removeItem(userKey);
        return structuredClone(defaultData);
    }
}

function saveData() {
    if (!currentUser) return;

    localStorage.setItem(
        getUserDataKey(currentUser),
        JSON.stringify(data)
    );
}

function money(amount) {

    return "₹" +
        Number(amount || 0)
            .toLocaleString("en-IN");

}


/* ================= CALCULATIONS ================= */

function getTotalSpent() {

    return data.expenses.reduce(
        (total, expense) =>
            total + Number(expense.amount),
        0
    );

}



function getRemaining() {
    return Math.max(
        Number(data.budget) -
        getTotalSpent() -
        (Number(data.goal.saved) || 0),
        0
    );
}


function getDaysLeft() {

    const today = new Date();

    const lastDay =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );

    return Math.max(
        1,
        lastDay.getDate() -
        today.getDate() +
        1
    );

}


function getDailyLimit() {

    return getRemaining() /
        getDaysLeft();

}


/* ================= DASHBOARD ================= */

function updateDashboard() {

    const spent =
        getTotalSpent();

    const remaining =
        getRemaining();

    const budget =
        Number(data.budget) || 0;


    const user = currentUser || "Buddy";

    document.getElementById(
        "dashboardName"
    ).textContent = user;


    document.getElementById(
        "budgetDisplay"
    ).textContent =
        budget.toLocaleString("en-IN");


    document.getElementById(
        "remaining"
    ).textContent =
        money(remaining);


    document.getElementById(
        "spentText"
    ).textContent =
        `${money(spent)} spent of ${money(budget)}`;


    document.getElementById(
        "dailyLimit"
    ).textContent =
        money(
            Math.floor(
                getDailyLimit()
            )
        );


    const percentage =
        budget > 0
            ? Math.min(
                spent / budget * 100,
                100
            )
            : 0;


    document.getElementById(
        "budgetBar"
    ).style.width =
        percentage + "%";


    renderGoal();
    renderTransactions();

}


/* ================= BUDGET ================= */

function setBudget() {

    const amount =
        Number(
            document.getElementById(
                "budgetInput"
            ).value
        );


    if (!amount || amount <= 0) {

        showToast(
            "Enter a valid monthly budget 😭"
        );

        return;

    }


    data.budget = amount;

    saveData();

    updateDashboard();


    document.getElementById(
        "budgetInput"
    ).value = "";


    showToast(
        "Budget updated. Don't betray it. 👀"
    );

}

/* ================= ADD EXPENSE ================= */

function addExpense() {

    const name =
        document.getElementById(
            "expenseName"
        ).value.trim();

    const amount =
        Number(
            document.getElementById(
                "expenseAmount"
            ).value
        );

    const category =
        document.getElementById(
            "expenseCategory"
        ).value;


    if (
        !name ||
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Enter the expense name + amount 😭"
        );

        return;

    }


    data.expenses.push({

        id: Date.now(),

        name: name,

        amount: amount,

        category: category,

        date:
            new Date().toISOString()

    });


    saveData();

    updateDashboard();


    document.getElementById(
        "expenseName"
    ).value = "";

    document.getElementById(
        "expenseAmount"
    ).value = "";


    showToast(
        "Expense added. Your wallet felt that. 💸"
    );

}

function handleHistoryFilterChange() {
    const filter = document.getElementById("historyFilter");
    const controls = document.getElementById("customDateControls");

    if (filter && controls) {
        controls.hidden = filter.value !== "custom";
    }

    renderTransactions();
}

/* ================= TRANSACTIONS ================= */


function renderTransactions() {
    const box = document.getElementById("transactions");
    const count = document.getElementById("expenseCount");
    const filter = document.getElementById("historyFilter");
    const startInput = document.getElementById("historyStartDate");
    const endInput = document.getElementById("historyEndDate");

    if (!box) return;

    const selectedFilter = filter ? filter.value : "all";
    let expenses = data.expenses.slice();
    const now = Date.now();

    if (selectedFilter === "7days" || selectedFilter === "30days") {
        const days = selectedFilter === "7days" ? 7 : 30;
        const cutoff = now - days * 24 * 60 * 60 * 1000;

        expenses = expenses.filter(expense => {
            if (!expense.date) return false;

            const expenseTime = new Date(expense.date).getTime();

            return Number.isFinite(expenseTime)
                && expenseTime >= cutoff
                && expenseTime <= now;
        });
    }

    if (selectedFilter === "custom") {
        const startValue = startInput ? startInput.value : "";
        const endValue = endInput ? endInput.value : "";

        if (!startValue || !endValue) {
            if (count) count.textContent = "0";
            box.innerHTML = `
                <div class="empty">
                    Choose a start date and end date, then tap Apply. 📅
                </div>
            `;
            return;
        }

        const startDate = new Date(startValue + "T00:00:00").getTime();
        const endDate = new Date(endValue + "T23:59:59.999").getTime();

        if (
            !Number.isFinite(startDate) ||
            !Number.isFinite(endDate) ||
            startDate > endDate
        ) {
            if (count) count.textContent = "0";
            box.innerHTML = `
                <div class="empty">
                    Please choose a valid date range. ✨
                </div>
            `;
            return;
        }

        expenses = expenses.filter(expense => {
            if (!expense.date) return false;

            const expenseTime = new Date(expense.date).getTime();

            return Number.isFinite(expenseTime)
                && expenseTime >= startDate
                && expenseTime <= endDate;
        });
    }

    if (count) {
        count.textContent = expenses.length;
    }

    if (expenses.length === 0) {
        const message = selectedFilter === "all"
            ? "No financial damage yet. Suspicious. 👀"
            : "No expenses found for this period. ✨";

        box.innerHTML = `<div class="empty">${message}</div>`;
        return;
    }

    box.innerHTML = expenses
        .sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime() || 0;
            const dateB = new Date(b.date || 0).getTime() || 0;
            return dateB - dateA;
        })
        .map(expense => {
            const date = expense.date ? new Date(expense.date) : null;
            const validDate = date && Number.isFinite(date.getTime());

            const dateText = validDate
                ? date.toLocaleDateString("en-IN")
                : "Date unavailable";

            return `
                <div class="transaction">
                    <div>
                        <div class="transaction-name">
                            ${escapeHTML(String(expense.name || "Expense"))}
                        </div>
                        <div class="transaction-category">
                            ${escapeHTML(String(expense.category || "Other"))}
                            · ${dateText}
                        </div>
                    </div>

                    <div style="display:flex;align-items:center;">
                        <span class="amount">
                            -${money(Number(expense.amount) || 0)}
                        </span>
                        <button
                            class="delete"
                            onclick="deleteExpense(${Number(expense.id)})"
                            aria-label="Delete expense"
                            title="Delete expense"
                        >×</button>
                    </div>
                </div>
            `;
        })
        .join("");
}

function deleteExpense(id) {

    data.expenses =
        data.expenses.filter(
            expense =>
                expense.id !== id
        );

    saveData();

    updateDashboard();

    showToast(
        "Expense deleted. Wallet survived. ✨"
    );

}

/* ================= SAVINGS GOAL ================= */

function renderGoal() {

    const nameInput =
        document.getElementById(
            "goalName"
        );

    const targetInput =
        document.getElementById(
            "goalTarget"
        );


    nameInput.value =
        data.goal.name || "";


    targetInput.value =
        data.goal.target || "";


    const target =
        Number(data.goal.target) || 0;

    const saved =
        Math.min(
            Number(data.goal.saved) || 0,
            target
        );


    document.getElementById(
        "goalSaved"
    ).textContent =
        saved.toLocaleString(
            "en-IN"
        );


    const percentage =
        target > 0
            ? saved / target * 100
            : 0;


    document.getElementById(
        "goalPercent"
    ).textContent =
        Math.round(percentage) + "%";


    document.getElementById(
        "goalFill"
    ).style.width =
        percentage + "%";

}


function saveGoal() {

    data.goal.name =
        document.getElementById(
            "goalName"
        ).value.trim();


    const target =
        Number(
            document.getElementById(
                "goalTarget"
            ).value
        );


    data.goal.target =
        target > 0
            ? target
            : 0;


    if (!data.goal.target) {
        data.goal.saved = 0;
    }


    data.goal.saved =
        Math.min(
            data.goal.saved,
            data.goal.target
        );


    saveData();

    updateDashboard();

}



function addToGoal() {
    if (!data.goal.target) {
        showToast("Set your savings goal first.");
        return;
    }

    if (data.goal.saved >= data.goal.target) {
        showToast("Goal complete. Character development. 🏆");
        return;
    }

    const remaining = getRemaining();
    const amountToSave = Math.min(
        100,
        data.goal.target - data.goal.saved
    );

    if (remaining < amountToSave) {
        showToast("Not enough money left to set this aside. 💸");
        return;
    }

    data.goal.saved += amountToSave;

    saveData();
    updateDashboard();

    showToast(
        `₹${amountToSave} set aside. Left to Spend updated! 💗`
    );
}

/* ================= LOGIN ================= */

function loginUser() {
    const input = document.getElementById("usernameInput");
    const name = input.value.trim();

    if (!name) {
        input.focus();
        return;
    }

    currentUser = name;
    localStorage.setItem(USER_KEY, name);
    data = loadData(name);

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "";

    updateDashboard();

    showToast("Welcome back, " + name + "! 💸");
}

function logoutUser() {
    const confirmed = confirm(
        "Log out? Your saved budget and expenses will stay on this phone."
    );

    if (!confirmed) return;

    localStorage.removeItem(USER_KEY);

    currentUser = "";
    data = structuredClone(defaultData);

    document.getElementById("usernameInput").value = "";
    document.getElementById("app").style.display = "none";
    document.getElementById("loginScreen").style.display = "grid";

    showToast("Logged out. Your data is still saved. 💗");
}

function checkLogin() {
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedUser) {
        currentUser = savedUser;
        data = loadData(savedUser);

        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("app").style.display = "";

        updateDashboard();
    } else {
        currentUser = "";
        data = structuredClone(defaultData);

        document.getElementById("loginScreen").style.display = "grid";
        document.getElementById("app").style.display = "none";
    }
}

/* ================= RESET ================= */

function resetApp() {

    const confirmed =
        confirm(
            "Reset all Broke Buddy data?"
        );


    if (!confirmed) return;


    data =
        structuredClone(
            defaultData
        );


    saveData();

    updateDashboard();


    showToast(
        "Fresh start unlocked. ✨"
    );

}


/* ================= HELPERS ================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


let toastTimer;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;

    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            2400
        );

}


/* ================= EVENTS ================= */

document
    .getElementById("goalName")
    .addEventListener(
        "change",
        saveGoal
    );


document
    .getElementById("goalTarget")
    .addEventListener(
        "change",
        saveGoal
    );

document
    .getElementById("expenseAmount")
    .addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                addExpense();
            }

        }
    );


document
    .getElementById("usernameInput")
    .addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                loginUser();
            }

        }
    );
    
/* ================= START ================= */

checkLogin();

updateDashboard();


/* ================= BUTTON EVENTS ================= */

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) loginBtn.addEventListener("click", loginUser);

const budgetBtn = document.getElementById("budgetBtn");
if (budgetBtn) budgetBtn.addEventListener("click", setBudget);

const addExpenseBtn = document.getElementById("addExpenseBtn");
if (addExpenseBtn) addExpenseBtn.addEventListener("click", addExpense);

const saveBtn = document.getElementById("saveBtn");
if (saveBtn) saveBtn.addEventListener("click", saveGoal);

const resetBtn = document.getElementById("resetBtn");
if (resetBtn) resetBtn.addEventListener("click", resetApp);

/* ================= EXTRA ENTER KEY SUPPORT ================= */

document
    .getElementById("budgetInput")
    .addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                setBudget();
            }

        }
    );


document
    .getElementById("expenseName")
    .addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                addExpense();
            }

        }
    );

/* ================= ADD TO GOAL ================= */

const goalAddButton =
    document.getElementById(
        "addGoalBtn"
    );

if (goalAddButton) {

    goalAddButton.addEventListener(
        "click",
        addToGoal
    );
}

/* ================= FINAL INITIALIZATION ================= */

updateDashboard();