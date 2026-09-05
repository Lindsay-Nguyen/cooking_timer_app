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

/*
  START A NEW REMINDER
*/

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

  if (reminders.length >= 20) {
    alert("You can only have 20 active reminders.");
    return;
  }

  const reminder = {
    id: Date.now() + Math.random(),
    text: reminderText,
    time: time,
    unit: unit,
    remainingSeconds: convertToSeconds(time, unit),
    state: "running",
    intervalId: null,
    alarmTimeoutId: null,
    completedAt: null,
    element: null
  };

  reminders.push(reminder);

  createActiveReminder(reminder);
  updateActiveCount();

  reminderInput.value = "";
  reminderInput.focus();
});

/*
  CONVERT HOURS OR MINUTES INTO SECONDS
*/

function convertToSeconds(time, unit) {
  if (unit === "seconds") {
    return time;
  }

  if (unit === "minutes") {
    return time * 60;
  }

  return time * 60 * 60;
}

/*
  CREATE AN ACTIVE REMINDER
*/

function createActiveReminder(reminder) {
  removeEmptyActiveMessage();

  const reminderItem =
    document.createElement("article");

  reminderItem.classList.add("reminder-item");

  const reminderDetails =
    document.createElement("div");

  reminderDetails.classList.add("reminder-details");

  const reminderTitle =
    document.createElement("h3");

  reminderTitle.textContent = reminder.text;

  const originalTime =
    document.createElement("p");

  originalTime.textContent =
    `Set for ${reminder.time} ${getDisplayedUnit(reminder)}`;

  reminderDetails.appendChild(reminderTitle);
  reminderDetails.appendChild(originalTime);

  const countdownArea =
    document.createElement("div");

  countdownArea.classList.add("reminder-countdown");

  const clockSymbol =
    document.createElement("span");

  clockSymbol.classList.add("clock-symbol");
  clockSymbol.textContent = "⏱️";

  const countdownText =
    document.createElement("strong");

  countdownText.classList.add("countdown-text");

  countdownArea.appendChild(clockSymbol);
  countdownArea.appendChild(countdownText);

  const controls =
    document.createElement("div");

  controls.classList.add("reminder-controls");

  const pauseButton =
    document.createElement("button");

  pauseButton.type = "button";
  pauseButton.classList.add("control-button");
  pauseButton.textContent = "Pause";

  const deleteButton =
    document.createElement("button");

  deleteButton.type = "button";
  deleteButton.classList.add(
    "control-button",
    "delete-reminder-button"
  );

  deleteButton.textContent = "Delete";

  controls.appendChild(pauseButton);
  controls.appendChild(deleteButton);

  reminderItem.appendChild(reminderDetails);
  reminderItem.appendChild(countdownArea);
  reminderItem.appendChild(controls);

  waitingList.appendChild(reminderItem);

  reminder.element = reminderItem;

  updateCountdownText(
    reminder.remainingSeconds,
    countdownText
  );

  pauseButton.addEventListener("click", function () {
    togglePause(
      reminder,
      pauseButton,
      countdownText
    );
  });

  deleteButton.addEventListener("click", function () {
    deleteActiveReminder(reminder);
  });

  startCountdown(
    reminder,
    countdownText,
    controls
  );
}

/*
  START OR RESUME ONE TIMER
*/

function startCountdown(
  reminder,
  countdownText,
  controls
) {
  clearInterval(reminder.intervalId);

  reminder.intervalId = setInterval(function () {
    if (reminder.state !== "running") {
      return;
    }

    reminder.remainingSeconds--;

    updateCountdownText(
      reminder.remainingSeconds,
      countdownText
    );

    if (reminder.remainingSeconds <= 0) {
      clearInterval(reminder.intervalId);

      beginRepeatingAlarm(
        reminder,
        countdownText,
        controls
      );
    }
  }, 1000);
}

/*
  PAUSE OR CONTINUE ONE TIMER
*/

function togglePause(
  reminder,
  pauseButton,
  countdownText
) {
  if (reminder.state === "running") {
    reminder.state = "paused";

    clearInterval(reminder.intervalId);

    pauseButton.textContent = "Continue";
    countdownText.classList.add("paused-time");

    return;
  }

  if (reminder.state === "paused") {
    reminder.state = "running";

    pauseButton.textContent = "Pause";
    countdownText.classList.remove("paused-time");

    startCountdown(
      reminder,
      countdownText,
      pauseButton.parentElement
    );
  }
}

/*
  DELETE AN ACTIVE REMINDER
*/

function deleteActiveReminder(reminder) {
  const shouldDelete = confirm(
    `Delete "${reminder.text}"?`
  );

  if (!shouldDelete) {
    return;
  }

  clearInterval(reminder.intervalId);
  clearTimeout(reminder.alarmTimeoutId);

  removeReminderFromActiveArray(reminder);

  reminder.element.remove();

  updateActiveCount();
  showEmptyActiveMessage();
}

/*
  START THE REPEATING SPOKEN ALARM
*/

function beginRepeatingAlarm(
  reminder,
  countdownText,
  controls
) {
  reminder.state = "alarming";

  countdownText.textContent = "ALARM";
  reminder.element.classList.add("alarming");

  controls.innerHTML = "";

  const stopAlarmButton =
    document.createElement("button");

  stopAlarmButton.type = "button";
  stopAlarmButton.classList.add("stop-alarm-button");
  stopAlarmButton.textContent = "Stop alarm";

  controls.appendChild(stopAlarmButton);

  stopAlarmButton.addEventListener("click", function () {
    stopAlarmAndComplete(reminder);
  });

  repeatSpokenReminder(reminder);
}
let availableVoices = [];

function loadVoices() {
  availableVoices =
    window.speechSynthesis.getVoices();
}

loadVoices();

window.speechSynthesis.addEventListener(
  "voiceschanged",
  loadVoices
);

function createNaturalSpeech(message) {
  const speech =
    new SpeechSynthesisUtterance(message);

  const preferredVoiceNames = [
    "Ava",
    "Samantha",
    "Allison",
    "Susan",
    "Karen"
  ];

  const preferredVoice =
    availableVoices.find(function (voice) {
      return preferredVoiceNames.some(function (name) {
        return voice.name.includes(name);
      });
    });

  const fallbackVoice =
    availableVoices.find(function (voice) {
      return voice.lang === "en-US";
    });

  speech.voice = preferredVoice || fallbackVoice || null;
  speech.lang = "en-US";
  speech.rate = 0.92;
  speech.pitch = 1;
  speech.volume = 1;

  return speech;
}
/*
  REPEAT THE MESSAGE UNTIL STOP ALARM IS PRESSED
*/

function repeatSpokenReminder(reminder) {
  if (reminder.state !== "alarming") {
    return;
  }

  const message =
    `${reminder.text}. Your ${reminder.time} ` +
    `${getDisplayedUnit(reminder)} timer is done.`;

  const speech = createNaturalSpeech(message);

  speech.addEventListener("end", function () {
    if (reminder.state === "alarming") {
      reminder.alarmTimeoutId = setTimeout(function () {
        repeatSpokenReminder(reminder);
      }, 5000);
    }
  });

  speech.addEventListener("error", function () {
    if (reminder.state === "alarming") {
      reminder.alarmTimeoutId = setTimeout(function () {
        repeatSpokenReminder(reminder);
      }, 5000);
    }
  });

  window.speechSynthesis.speak(speech);
}

/*
  STOP THE ALARM AND MOVE IT TO COMPLETED
*/

function stopAlarmAndComplete(reminder) {
  reminder.state = "completed";
  reminder.completedAt = new Date();

  clearTimeout(reminder.alarmTimeoutId);

  /*
    SpeechSynthesis cancel affects all current speech.
    Other alarms will repeat again on their next cycle.
  */
  window.speechSynthesis.cancel();

  removeReminderFromActiveArray(reminder);

  reminder.element.remove();

  completedReminders.unshift(reminder);

  if (completedReminders.length > 100) {
    completedReminders.pop();
  }

  updateActiveCount();
  showEmptyActiveMessage();
  renderCompletedReminders();
}

/*
  REMOVE ONE REMINDER FROM THE ACTIVE ARRAY
*/

function removeReminderFromActiveArray(reminder) {
  const reminderIndex =
    reminders.findIndex(function (item) {
      return item.id === reminder.id;
    });

  if (reminderIndex !== -1) {
    reminders.splice(reminderIndex, 1);
  }
}

/*
  FORMAT THE COUNTDOWN
*/

function updateCountdownText(seconds, countdownText) {
  const safeSeconds = Math.max(0, seconds);

  const hours = Math.floor(safeSeconds / 3600);

  const minutes =
    Math.floor((safeSeconds % 3600) / 60);

  const secondsLeft = safeSeconds % 60;

  const formattedMinutes =
    String(minutes).padStart(2, "0");

  const formattedSeconds =
    String(secondsLeft).padStart(2, "0");

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

function getDisplayedUnit(reminder) {
  if (reminder.time === 1) {
    return reminder.unit.slice(0, -1);
  }

  return reminder.unit;
}

/*
  ACTIVE REMINDER COUNT AND EMPTY MESSAGE
*/

function updateActiveCount() {
  reminderCount.textContent =
    `${reminders.length} of 20 running`;
}

function removeEmptyActiveMessage() {
  const emptyMessage =
    waitingList.querySelector(".empty-message");

  if (emptyMessage) {
    emptyMessage.remove();
  }
}

function showEmptyActiveMessage() {
  if (
    reminders.length === 0 &&
    !waitingList.querySelector(".empty-message")
  ) {
    const emptyMessage =
      document.createElement("p");

    emptyMessage.classList.add("empty-message");

    emptyMessage.textContent =
      "No active reminders yet.";

    waitingList.appendChild(emptyMessage);
  }
}

/*
  COMPLETED REMINDERS
*/

function renderCompletedReminders() {
  completedList.innerHTML = "";

  if (completedReminders.length === 0) {
    const emptyMessage =
      document.createElement("p");

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

    checkbox.dataset.reminderId =
      String(reminder.id);

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

    const completedTime =
      reminder.completedAt.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      });

    details.textContent =
      `${reminder.time} ${getDisplayedUnit(reminder)} • ` +
      `Completed at ${completedTime}`;

    information.appendChild(title);
    information.appendChild(details);

    completedItem.appendChild(checkbox);
    completedItem.appendChild(information);

    completedList.appendChild(completedItem);
  });

  completedCount.textContent =
    `${completedReminders.length} of 100 completed`;
}

/*
  SWITCH BETWEEN TABS
*/

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

/*
  DELETE SELECTED COMPLETED REMINDERS
*/

deleteSelectedButton.addEventListener("click", function () {
  const selectedCheckboxes =
    completedList.querySelectorAll(
      ".completed-checkbox:checked"
    );

  if (selectedCheckboxes.length === 0) {
    alert("Select at least one completed reminder.");
    return;
  }

  const shouldDelete = confirm(
    `Delete ${selectedCheckboxes.length} selected reminder(s)?`
  );

  if (!shouldDelete) {
    return;
  }

  const selectedIds =
    Array.from(selectedCheckboxes).map(
      function (checkbox) {
        return Number(checkbox.dataset.reminderId);
      }
    );

  completedReminders =
    completedReminders.filter(function (reminder) {
      return !selectedIds.includes(reminder.id);
    });

  renderCompletedReminders();
});

/*
  VOICE COMMANDS AND CONFIRMATION
*/

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
  });

  recognition.addEventListener("end", function () {
    voiceButton.classList.remove("listening");
    voiceButton.textContent = "🎤";
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

  recognition.addEventListener("error", function (event) {
    if (event.error === "not-allowed") {
      alert("Please allow microphone access.");
    } else if (event.error !== "no-speech") {
      alert("I could not hear you. Please try again.");
    }
  });
} else {
  voiceButton.disabled = true;
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

  speakMessage(
    `${reminderText} in ${timeAmount} ${confirmationUnit}. ` +
    "Should I start now?",
    function () {
      recognition.start();
    }
  );
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
    "Please say yes or no.",
    function () {
      recognition.start();
    }
  );
}

function speakMessage(message, afterSpeaking) {
  const speech = createNaturalSpeech(message);

  if (afterSpeaking) {
    speech.addEventListener("end", afterSpeaking);
  }

  window.speechSynthesis.speak(speech);
}