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


let data = loadData();


/* ================= DATA ================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(DATA_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,

            expenses:
                Array.isArray(parsed.expenses)
                    ? parsed.expenses
                    : [],

            goal: {
                ...defaultData.goal,
                ...(parsed.goal || {})
            }
        };

    } catch {

        return structuredClone(defaultData);

    }

}


function saveData() {

    localStorage.setItem(
        DATA_KEY,
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
        getTotalSpent(),
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


    const user =
        localStorage.getItem(USER_KEY)
        || "Buddy";


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


/* ================= AFFORDABILITY ================= */

function checkAfford() {

    const amount =
        Number(
            document.getElementById(
                "checkAmount"
            ).value
        );

    const remaining =
        getRemaining();

    const result =
        document.getElementById(
            "checkerResult"
        );


    if (!amount || amount <= 0) {

        result.className =
            "checker-result danger";

        result.textContent =
            "DUDE... enter an actual amount 😭";

        return;

    }


    /* MORE THAN REMAINING */

    if (amount > remaining) {

        result.className =
            "checker-result danger";

        result.textContent =
            `Nope. You're short by ${
                money(amount - remaining)
            }. That's over your remaining budget. 💀`;

        return;

    }


    /* EXACT REMAINING */

    if (amount === remaining) {

        result.className =
            "checker-result danger";

        result.textContent =
            `Technically affordable, BUT this uses 100% of your remaining budget. You'll have ₹0 left. Put the card down. 👀`;

        return;

    }


    const percentage =
        (amount / remaining) * 100;


    /* MORE THAN HALF */

    if (percentage > 50) {

        result.className =
            "checker-result warn";

        result.textContent =
            `You can afford it, but it eats ${
                Math.round(percentage)
            }% of your remaining budget. Think twice.`;

        return;

    }


    /* MEDIUM */

    if (percentage > 25) {

        result.className =
            "checker-result warn";

        result.textContent =
            `You can afford it, but ${
                Math.round(percentage)
            }% of your remaining money is leaving the chat. 👀`;

        return;

    }


    /* SAFE */

    result.className =
        "checker-result safe";

    result.textContent =
        `Looks manageable — only ${
            Math.round(percentage)
        }% of your remaining budget. Your wallet approves... cautiously. 😌`;

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


/* ================= TRANSACTIONS ================= */

function renderTransactions() {

    const box =
        document.getElementById(
            "transactions"
        );


    document.getElementById(
        "expenseCount"
    ).textContent =
        data.expenses.length;


    if (!data.expenses.length) {

        box.innerHTML =
            `<div class="empty">
                No financial damage yet.
                Suspicious. 👀
            </div>`;

        return;

    }


    box.innerHTML =
        data.expenses
            .slice()
            .reverse()
            .slice(0, 8)
            .map(expense => `

                <div class="transaction">

                    <div>

                        <div class="transaction-name">
                            ${escapeHTML(
                                expense.name
                            )}
                        </div>

                        <div class="transaction-category">
                            ${escapeHTML(
                                expense.category
                            )}
                            ·
                            ${new Date(
                                expense.date
                            ).toLocaleDateString(
                                "en-IN"
                            )}
                        </div>

                    </div>

                    <div>

                        <span class="amount">
                            -${money(expense.amount)}
                        </span>

                        <button
                            class="delete"
                            onclick="deleteExpense(${expense.id})"
                        >
                            ×
                        </button>

                    </div>

                </div>

            `)
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

        showToast(
            "Set your savings goal first."
        );

        return;

    }


    if (
        data.goal.saved >=
        data.goal.target
    ) {

        showToast(
            "Goal complete. Character development. 🏆"
        );

        return;

    }


    data.goal.saved =
        Math.min(
            data.goal.saved + 100,
            data.goal.target
        );


    saveData();

    updateDashboard();


    showToast(
        "₹100 saved. Tiny wins count. 🫡"
    );

}


/* ================= LOGIN ================= */

function loginUser() {

    const input =
        document.getElementById(
            "usernameInput"
        );

    const name =
        input.value.trim();


    if (!name) {

        input.focus();

        return;

    }


    localStorage.setItem(
        USER_KEY,
        name
    );


    document.getElementById(
        "dashboardName"
    ).textContent = name;


    document.getElementById(
        "loginScreen"
    ).style.display = "none";


    showToast(
        "Let's see what financial damage we're dealing with today. 💀"
    );

}


function checkLogin() {

    const saved =
        localStorage.getItem(
            USER_KEY
        );


    if (saved) {

        document.getElementById(
            "dashboardName"
        ).textContent =
            saved;

        document.getElementById(
            "loginScreen"
        ).style.display =
            "none";

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
    .getElementById("checkAmount")
    .addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                checkAfford();
            }

        }
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

const checkBtn = document.getElementById("checkBtn");
if (checkBtn) checkBtn.addEventListener("click", checkAfford);

const addExpenseBtn = document.getElementById("addExpenseBtn");
if (addExpenseBtn) addExpenseBtn.addEventListener("click", addExpense);

const saveBtn = document.getElementById("saveBtn");
if (saveBtn) saveBtn.addEventListener("click", saveGoal);

const resetBtn = document.getElementById("resetBtn");
if (resetBtn) resetBtn.addEventListener("click", resetApp);
document
    .getElementById("loginBtn")
    .addEventListener(
        "click",
        loginUser
    );

document
    .getElementById("budgetBtn")
    .addEventListener(
        "click",
        setBudget
    );


document
    .getElementById("checkBtn")
    .addEventListener(
        "click",
        checkAfford
    );


document
    .getElementById("addExpenseBtn")
    .addEventListener(
        "click",
        addExpense
    );


document
    .getElementById("saveBtn")
    .addEventListener(
        "click",
        saveGoal
    );


document
    .getElementById("resetBtn")
    .addEventListener(
        "click",
        resetApp
    );


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