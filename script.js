const reminderInput = document.querySelector("#reminder-input");
const timerNumber = document.querySelector("#timer-number");
const timerUnit = document.querySelector("#timer-unit");
const startButton = document.querySelector(".start-button");
const waitingList = document.querySelector("#waiting-reminders");
const reminderCount = document.querySelector("#reminder-count");

const reminders = [];

startButton.addEventListener("click", function () {
  const reminderText = reminderInput.value.trim();
  const time = Number(timerNumber.value);
  const unit = timerUnit.value;

  if (reminderText === "") {
    alert("Please enter a reminder.");
    return;
  }

  if (time <= 0) {
    alert("Please enter a time greater than zero.");
    return;
  }

  if (reminders.length >= 20) {
    alert("You can only have 20 running reminders.");
    return;
  }

  const reminder = {
    text: reminderText,
    time: time,
    unit: unit
  };

  reminders.push(reminder);

  const emptyMessage = document.querySelector(".empty-message");

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const reminderItem = document.createElement("article");
  reminderItem.classList.add("reminder-item");

  const reminderDetails = document.createElement("div");

  const reminderTitle = document.createElement("h3");
  reminderTitle.textContent = reminder.text;

  const reminderTime = document.createElement("p");
  reminderTime.textContent = `Set for ${reminder.time} ${reminder.unit}`;

  reminderDetails.appendChild(reminderTitle);
  reminderDetails.appendChild(reminderTime);

  reminderItem.appendChild(reminderDetails);
  waitingList.appendChild(reminderItem);

  reminderCount.textContent = `${reminders.length} of 20 running`;

  reminderInput.value = "";
  reminderInput.focus();
});