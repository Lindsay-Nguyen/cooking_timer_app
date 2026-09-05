const reminderInput =
  document.querySelector("#reminder-input");

const timerNumber =
  document.querySelector("#timer-number");

const timerUnit =
  document.querySelector("#timer-unit");

const startButton =
  document.querySelector(".start-button");

const voiceButton =
  document.querySelector(".voice-button");

const waitingList =
  document.querySelector("#waiting-reminders");

const reminderCount =
  document.querySelector("#reminder-count");

const remindersTab =
  document.querySelector("#reminders-tab");

const completedTab =
  document.querySelector("#completed-tab");

const reminderSection =
  document.querySelector("#reminder-section");

const completedSection =
  document.querySelector("#completed-section");

const completedList =
  document.querySelector("#completed-reminders");

const completedCount =
  document.querySelector("#completed-count");

const deleteSelectedButton =
  document.querySelector("#delete-selected");

const reminders = [];
let completedReminders = [];

startButton.addEventListener("click", function () {
  const reminderText = reminderInput.value.trim();
  const time = Number(timerNumber.value);
  const unit = timerUnit.value;

  if (reminderText === "") {
    alert("Please enter a reminder.");
    return;
  }

  if (!Number.isFinite(time) || time <= 0) {
    alert("Please enter a time greater than zero.");
    return;
  }

  const activeReminders = reminders.filter(function (reminder) {
    return reminder.finished === false;
  });

  if (activeReminders.length >= 20) {
    alert("You can only have 20 running reminders.");
    return;
  }

  const totalSeconds = convertToSeconds(time, unit);

  const reminder = {
    id: Date.now() + Math.random(),
    text: reminderText,
    time: time,
    unit: unit,
    remainingSeconds: totalSeconds,
    finished: false,
    completedAt: null
  };

  reminders.push(reminder);

  addReminderToWaitingList(reminder);
  updateReminderCount();

  reminderInput.value = "";
  reminderInput.focus();
});

function convertToSeconds(time, unit) {
  if (unit === "seconds") {
    return time;
  }

  if (unit === "minutes") {
    return time * 60;
  }

  return time * 60 * 60;
}

function addReminderToWaitingList(reminder) {
  const emptyMessage =
    waitingList.querySelector(".empty-message");

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const reminderItem = document.createElement("article");
  reminderItem.classList.add("reminder-item");

  const reminderDetails = document.createElement("div");
  reminderDetails.classList.add("reminder-details");

  const reminderTitle = document.createElement("h3");
  reminderTitle.textContent = reminder.text;

  const reminderTime = document.createElement("p");
  reminderTime.textContent =
    `Set for ${reminder.time} ${getDisplayedUnit(reminder)}`;

  const countdownArea = document.createElement("div");
  countdownArea.classList.add("reminder-countdown");

  const clockSymbol = document.createElement("span");
  clockSymbol.classList.add("clock-symbol");
  clockSymbol.textContent = "⏱️";

  const countdownText = document.createElement("strong");
  countdownText.classList.add("countdown-text");

  reminderDetails.appendChild(reminderTitle);
  reminderDetails.appendChild(reminderTime);

  countdownArea.appendChild(clockSymbol);
  countdownArea.appendChild(countdownText);

  reminderItem.appendChild(reminderDetails);
  reminderItem.appendChild(countdownArea);

  waitingList.appendChild(reminderItem);

  updateCountdownText(
    reminder.remainingSeconds,
    countdownText
  );

  const timer = setInterval(function () {
    reminder.remainingSeconds--;

    updateCountdownText(
      reminder.remainingSeconds,
      countdownText
    );

    if (reminder.remainingSeconds <= 0) {
      clearInterval(timer);

      reminder.finished = true;
      countdownText.textContent = "Speaking…";
      reminderItem.classList.add("finished");

      updateReminderCount();

      speakReminder(reminder).then(function () {
        setTimeout(function () {
          moveToCompleted(reminder, reminderItem);
        }, 700);
      });
    }
  }, 1000);
}

function getDisplayedUnit(reminder) {
  if (reminder.time === 1) {
    return reminder.unit.slice(0, -1);
  }

  return reminder.unit;
}

function updateCountdownText(seconds, countdownText) {
  const safeSeconds = Math.max(0, seconds);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes =
    Math.floor((safeSeconds % 3600) / 60);

  const remainingSeconds = safeSeconds % 60;

  const formattedMinutes =
    String(minutes).padStart(2, "0");

  const formattedSeconds =
    String(remainingSeconds).padStart(2, "0");

  if (hours > 0) {
    const formattedHours =
      String(hours).padStart(2, "0");

    countdownText.textContent =
      `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    countdownText.textContent =
      `${formattedMinutes}:${formattedSeconds}`;
  }
}

function speakReminder(reminder) {
  return new Promise(function (resolve) {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    const message =
      `${reminder.text}. Your ${reminder.time} ` +
      `${getDisplayedUnit(reminder)} timer is done.`;

    const speech =
      new SpeechSynthesisUtterance(message);

    speech.lang = "en-US";
    speech.rate = 0.9;
    speech.volume = 1;

    speech.addEventListener("end", resolve);
    speech.addEventListener("error", resolve);

    window.speechSynthesis.speak(speech);
  });
}

function moveToCompleted(reminder, reminderItem) {
  reminder.completedAt = new Date();

  reminderItem.remove();

  completedReminders.unshift(reminder);

  if (completedReminders.length > 100) {
    completedReminders.pop();
  }

  showEmptyWaitingMessage();
  renderCompletedReminders();
}

function showEmptyWaitingMessage() {
  const activeReminders = reminders.filter(function (reminder) {
    return reminder.finished === false;
  });

  if (
    activeReminders.length === 0 &&
    !waitingList.querySelector(".empty-message")
  ) {
    const emptyMessage = document.createElement("p");

    emptyMessage.classList.add("empty-message");
    emptyMessage.textContent =
      "No active reminders yet.";

    waitingList.appendChild(emptyMessage);
  }
}

function renderCompletedReminders() {
  completedList.innerHTML = "";

  if (completedReminders.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.classList.add(
      "completed-empty-message"
    );

    emptyMessage.textContent =
      "No completed reminders yet.";

    completedList.appendChild(emptyMessage);
  }

  completedReminders.forEach(function (reminder) {
    const completedItem =
      document.createElement("article");

    completedItem.classList.add("completed-item");

    const checkbox =
      document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.classList.add("completed-checkbox");
    checkbox.dataset.reminderId = reminder.id;
    checkbox.setAttribute(
      "aria-label",
      `Select ${reminder.text} for deletion`
    );

    const information =
      document.createElement("div");

    const title =
      document.createElement("h3");

    title.textContent = reminder.text;

    const details =
      document.createElement("p");

    details.textContent =
      `${reminder.time} ${getDisplayedUnit(reminder)} • ` +
      `Completed at ${reminder.completedAt.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      })}`;

    information.appendChild(title);
    information.appendChild(details);

    completedItem.appendChild(checkbox);
    completedItem.appendChild(information);

    completedList.appendChild(completedItem);
  });

  completedCount.textContent =
    `${completedReminders.length} of 100 completed`;
}

function updateReminderCount() {
  const activeReminders = reminders.filter(function (reminder) {
    return reminder.finished === false;
  });

  reminderCount.textContent =
    `${activeReminders.length} of 20 running`;
}

remindersTab.addEventListener("click", function () {
  reminderSection.hidden = false;
  completedSection.hidden = true;

  remindersTab.classList.add("active");
  completedTab.classList.remove("active");
});

completedTab.addEventListener("click", function () {
  reminderSection.hidden = true;
  completedSection.hidden = false;

  completedTab.classList.add("active");
  remindersTab.classList.remove("active");
});

deleteSelectedButton.addEventListener("click", function () {
  const selectedCheckboxes =
    completedList.querySelectorAll(
      ".completed-checkbox:checked"
    );

  if (selectedCheckboxes.length === 0) {
    alert("Select at least one completed reminder.");
    return;
  }

  const selectedIds =
    Array.from(selectedCheckboxes).map(function (checkbox) {
      return Number(checkbox.dataset.reminderId);
    });

  completedReminders =
    completedReminders.filter(function (reminder) {
      return !selectedIds.includes(reminder.id);
    });

  renderCompletedReminders();
});
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

const numberWords = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20
};

let waitingForConfirmation = false;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceButton.addEventListener("click", function () {
    waitingForConfirmation = false;
    recognition.start();
  });

  recognition.addEventListener("start", function () {
    voiceButton.classList.add("listening");
    voiceButton.textContent = "🔴";
    voiceButton.setAttribute("aria-label", "Listening");
  });

  recognition.addEventListener("result", function (event) {
    const spokenWords =
      event.results[0][0].transcript.trim();

    if (waitingForConfirmation) {
      handleConfirmation(spokenWords, recognition);
    } else {
      handleVoiceCommand(spokenWords, recognition);
    }
  });

  recognition.addEventListener("end", function () {
    voiceButton.classList.remove("listening");
    voiceButton.textContent = "🎤";
    voiceButton.setAttribute(
      "aria-label",
      "Speak reminder"
    );
  });

  recognition.addEventListener("error", function (event) {
    voiceButton.classList.remove("listening");
    voiceButton.textContent = "🎤";

    if (event.error === "not-allowed") {
      alert("Please allow microphone access in Chrome.");
    } else if (event.error !== "no-speech") {
      alert("I could not hear you. Please try again.");
    }
  });
} else {
  voiceButton.disabled = true;

  voiceButton.title =
    "Voice recognition is not supported in this browser.";
}

function handleVoiceCommand(spokenWords, recognition) {
  const timePattern =
    /\b(?:in|for)\s+(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+(seconds?|minutes?|hours?)\b/i;

  const timeMatch = spokenWords.match(timePattern);

  if (!timeMatch) {
    reminderInput.value = spokenWords;

    speakMessage(
      "I added the reminder, but I did not understand the time."
    );

    return;
  }

  const spokenNumber = timeMatch[1].toLowerCase();
  const spokenUnit = timeMatch[2].toLowerCase();

  let timeAmount = Number(spokenNumber);

  if (Number.isNaN(timeAmount)) {
    timeAmount = numberWords[spokenNumber];
  }

  const selectedUnit = spokenUnit.endsWith("s")
    ? spokenUnit
    : `${spokenUnit}s`;

  const reminderText = spokenWords
    .replace(timeMatch[0], "")
    .replace(/[,.!?]+$/, "")
    .trim();

  reminderInput.value = reminderText;
  timerNumber.value = timeAmount;
  timerUnit.value = selectedUnit;

  waitingForConfirmation = true;

  const confirmationUnit =
    timeAmount === 1
      ? selectedUnit.slice(0, -1)
      : selectedUnit;

  const confirmationMessage =
    `${reminderText} in ${timeAmount} ${confirmationUnit}. ` +
    "Should I start now?";

  speakMessage(confirmationMessage, function () {
    recognition.start();
  });
}

function handleConfirmation(spokenWords, recognition) {
  const answer = spokenWords.toLowerCase();

  const saidYes =
    answer.includes("yes") ||
    answer.includes("yeah") ||
    answer.includes("start");

  const saidNo =
    answer.includes("no") ||
    answer.includes("cancel") ||
    answer.includes("stop");

  if (saidYes) {
    waitingForConfirmation = false;

    startButton.click();

    speakMessage("Starting your timer now.");
    return;
  }

  if (saidNo) {
    waitingForConfirmation = false;

    reminderInput.value = "";

    speakMessage("Okay, the reminder was canceled.");
    return;
  }

  speakMessage(
    "I did not understand. Please say yes or no.",
    function () {
      recognition.start();
    }
  );
}

function speakMessage(message, afterSpeaking) {
  const speech =
    new SpeechSynthesisUtterance(message);

  speech.lang = "en-US";
  speech.rate = 0.9;
  speech.volume = 1;

  if (afterSpeaking) {
    speech.addEventListener("end", afterSpeaking);
  }

  window.speechSynthesis.speak(speech);
}