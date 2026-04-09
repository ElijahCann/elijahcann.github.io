// ============================================================================
// WORD LINK - QUESTION PAGE
// ============================================================================
// This module manages the question/quiz interface, including:
// - Loading and displaying word link questions
// - Handling answer selection and validation
// - Dictionary popups with audio pronunciation
// - Audio playback with fallbacks (dictionary API → speech synthesis → no-audio)
// ============================================================================

import { getQuestionDataFromDB } from "./game.js";

// ============================================================================
// UTILITY: UI & SIZING
// ============================================================================

/**
 * Adjust font size dynamically based on window width
 * Used for answer buttons to ensure text fits responsively
 */
function adjustFontSize(button) {
  const containerWidth = window.innerWidth / 2 - 11;
  const newFontSize = 0.1 * containerWidth;
  button.style.fontSize = newFontSize + "px";
}

/**
 * Adjust body height for mobile/tablet devices
 * iOS and Android browsers need specific viewport handling
 */
function adjustSizing() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    document.body.style.height = "85vh";
  } else if (isAndroid) {
    document.body.style.height = "85vh";
  }
}

/**
 * Preload critical audio files for better performance
 * Preloads: fail sound, correct sound, click sound
 */
function audio() {
  new Audio("static/fail.mp3").preload = "auto";
  new Audio("static/correct.mp3").preload = "auto";
  new Audio("static/click.mp3").preload = "auto";
}

// ============================================================================
// AUDIO HANDLING
// ============================================================================

/**
 * Create a disabled audio button showing "no audio available"
 * Sets button image to NoSpeaker icon and plays NoAudio.mp3 when clicked
 * @param {Element} audioButton - The button element to configure
 * @param {boolean} blockOthers - Whether to prevent interaction with popup
 */
function createNoAudioButton(audioButton, blockOthers) {
  if (!audioButton) {
    return;
  }
  audioButton.src = "static/NoSpeaker.png";
  let noAudio = new Audio("static/NoAudio.mp3");
  audioButton.addEventListener(
    "click",
    noWordAudio(noAudio, audioButton, blockOthers),
  );
  noAudio.addEventListener("ended", function (event) {
    audioButton.classList.remove("disabled");
    event.preventDefault();
  });
}

/**
 * Generate and populate the dictionary popup with word definitions
 * Sets up the popup title and speaker button (with audio or no-audio handler)
 * @param {Array} words - Word data array with audio and definitions
 */
function generateText(words) {
  document.querySelector("#banner h2").innerHTML =
    `<b class="defined-word">${words[0].word}</b>`;

  let play = document.getElementById("play");
  if (!play) {
    console.warn("Popup speaker button not found");
  } else if (words[0]["audio"] != null) {
    play = removeAllEventListeners(play);
    play.src = "static/speaker.png";
    let audio = new Audio(words[0]["audio"]);
    play.setAttribute("data-loading", "true");
    audio.addEventListener("canplay", () => {
      play.removeAttribute("data-loading");
    });
    play.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (play.hasAttribute("data-loading")) {
        return;
      }
      audio.play();
    });
  } else if (window.speechSynthesis) {
    play = removeAllEventListeners(play);
    play.src = "static/speaker.png";
    const wordToSpeak = words[0].word;
    play.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      const utterance = new SpeechSynthesisUtterance(wordToSpeak);
      speechSynthesis.speak(utterance);
    });
  } else {
    play = removeAllEventListeners(play);
    createNoAudioButton(play, false);
  }

  // Build definition text with word type headings and definitions
  let text = "<br>";
  words.forEach((word) => {
    if (word.word !== words[0].word) {
      text += `<b class="defined-word">${word.word}</b><br>`;
    }
    for (const wordType in word.definitions) {
      text += `<b>${wordType}</b><br>`;
      for (
        let definitionNo = 0;
        definitionNo < word.definitions[wordType].length;
        definitionNo++
      ) {
        text += `&#149 ${word.definitions[wordType][definitionNo]}<br>`;
      }
      text += "<br>";
    }
  });
  document.querySelector("#popup #text").innerHTML = text;
}

/**
 * Hide the dictionary popup and reset its speaker button
 */
function hidePopup() {
  popup.style.visibility = "hidden";
  let play = document.getElementById("play");
  play.classList.remove("disabled");
  removeAllEventListeners(play);
}

/**
 * Determine if an answer button is correct or wrong and provide visual/audio feedback
 * @param {Element} button - The clicked answer button
 */
function isAnswerCorrect(button) {
  if (button.classList.contains("wrong")) {
    button.style.backgroundColor = "rgb(252, 43, 43)";
    const failAudio = new Audio("static/fail.mp3");v            
    failAudio.play();
  } else {
    button.style.backgroundColor = "rgb(38, 213, 96)";
    const correctAudio = new Audio("static/correct.mp3");
    correctAudio.play();
  }
}

// ============================================================================
// EVENT HANDLERS: ANSWER SELECTION
// ============================================================================

/**
 * Set up click handlers for all answer buttons (1-4)
 * Checks if button is already clicked, then validates answer
 * Skips missing buttons (e.g., in easy mode with only 2 answers)
 */
function mchoice() {
  for (let i = 1; i <= 4; i++) {
    let button = document.querySelector(`#ans${i}`);
    if (!button) {
      continue;
    }
    button.addEventListener("click", function (event) {
      // Check if any child audio or help buttons are loading
      const audioBtn = button.querySelector(`#audio${i}`);
      const helpBtn = button.querySelector(`#help${i}`);
      if (
        (audioBtn && audioBtn.hasAttribute("data-loading")) ||
        (helpBtn && helpBtn.hasAttribute("data-loading"))
      ) {
        event.preventDefault();
        return;
      }
      if (!button.classList.contains("disabled")) {
        button.classList.add("disabled");
        isAnswerCorrect(button);
      }
      event.preventDefault();
    });
  }
}

/**
 * Generic handler for audio buttons that have no audio available
 * Plays a "no audio" sound and prevents other interactions during playback
 * @param {Audio} audio - The no-audio sound effect
 * @param {Element} audioButton - The button element
 * @param {boolean} blockOthers - If true, prevents interaction when popup is visible
 */
function noWordAudio(audio, audioButton, blockOthers) {
  return function (event) {
    event.stopPropagation();
    if (blockOthers === true) {
      const popup = document.getElementById("popup");
      if (popup.style.visibility === "visible") {
        return;
      }
    }
    if (!audioButton.classList.contains("disabled")) {
      audioButton.classList.add("disabled");
      audio.play();
    }
    event.preventDefault();
  };
}

// ============================================================================
// EVENT HANDLERS: DICTIONARY & HELP
// ============================================================================

/**
 * Set up click handlers for all help/definition buttons (5 total: 1 main + 4 options)
 * Fetches word definitions from dictionary API when clicked
 */
function onDictButtonClick() {
  for (let i = 0; i < 5; i++) {
    const clickAudio = new Audio("static/click.mp3");
    const dictButton = document.querySelector(`#help${i}`);
    if (!dictButton) {
      continue;
    }
    dictButton.addEventListener("click", function (event) {
      event.stopPropagation();
      const popup = document.getElementById("popup");
      if (popup.style.visibility === "visible") {
        return;
      }
      // Don't allow clicking if already loading
      if (dictButton.hasAttribute("data-loading")) {
        event.preventDefault();
        return;
      }
      clickAudio.play().catch(() => {});
      const answerSpan = document.querySelector(`#ans${i} span`);
      const word = answerSpan ? answerSpan.innerText.trim() : "";
      if (!word) {
        console.warn(`No answer word found for help button #help${i}`);
        event.preventDefault();
        return;
      }
      // Mark button as loading with visual feedback
      dictButton.setAttribute("data-loading", "true");
      dictButton.style.opacity = "0.6";
      dictButton.style.pointerEvents = "none";
      // Fetch word definition from dictionary API
      fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Dictionary lookup failed: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          popupText(data, word);
          popup.style.visibility = "visible";
          // Clear loading state
          dictButton.removeAttribute("data-loading");
          dictButton.style.opacity = "1";
          dictButton.style.pointerEvents = "auto";
        })
        .catch((error) => {
          console.error("Error fetching dictionary data:", error);
          // Word not found - use popupText to handle audio button setup
          popupText(null, word);
          popup.style.visibility = "visible";
          // Clear loading state
          dictButton.removeAttribute("data-loading");
          dictButton.style.opacity = "1";
          dictButton.style.pointerEvents = "auto";
        });
      event.preventDefault();
    });
  }
}

/**
 * Handle the close (X) button on the dictionary popup
 */
function onExitButtonClick() {
  const exit = document.getElementById("exit");
  const clickAudio = new Audio("static/click.mp3");
  exit.addEventListener("click", function (event) {
    // play audio
    clickAudio.play();
    // reset popup
    popup.style.visibility = "hidden";
    let play = document.getElementById("play");
    play.classList.remove("disabled");
    removeAllEventListeners(play);
  });
}

/**
 * Handle the home button - navigates back to index.html
 * Plays click sound before navigation
 */
function onHomeButtonClick() {
  const home = document.querySelector("#home");
  const clickAudio = new Audio("static/click.mp3");

  home.addEventListener("click", function (event) {
    if (!home.classList.contains("disabled")) {
      home.classList.add("disabled");
      clickAudio.play();
      setTimeout(() => {
        window.location.href = "index.html";
      }, 100);
    }
    event.preventDefault();
  });
}

/**
 * Handle the next button - loads the next question
 * Plays click sound, hides popup, and fetches new question data
 */
function onNextButtonClick() {
  const next = document.querySelector(`#next`);
  const clickAudio = new Audio("static/click.mp3");

  next.addEventListener("click", function (event) {
    if (!next.classList.contains("disabled")) {
      next.classList.add("disabled");
      clickAudio.play();
      hidePopup();
      updateQuestion();
    }
    event.preventDefault();
  });
}

// ============================================================================
// DIFFICULTY & SPEAKER AUDIO SETUP
// ============================================================================

/**
 * Detect game difficulty from URL query params or pathname
 * Returns: "easy" or "hard" (defaults to hard)
 */
function getDifficultyFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty");
  if (difficulty === "easy" || difficulty === "hard") {
    return difficulty;
  }
  const path = window.location.pathname;
  if (path.includes("/easy")) {
    return "easy";
  }
  if (path.includes("/hard")) {
    return "hard";
  }
  return "hard";
}

/**
 * Set up speaker buttons for all words (main + options)
 * Audio fallback order: Dictionary API → Speech Synthesis → No-Audio Handler
 * @param {string} target - The main word to find links for
 * @param {Array} words - The word options shown to the user
 */
function onSpeakerButtonClick(target, words) {
  const difficulty = getDifficultyFromLocation();
  const numOptions = difficulty === "easy" ? 3 : 5;
  for (let i = 0; i < numOptions; i++) {
    let word;
    if (i === 0) {
      word = target;
    } else {
      word = words[i - 1];
    }
    const audioButton = document.getElementById(`audio${i}`);
    if (!audioButton) {
      continue;
    }
    // Mark button as loading with visual feedback
    audioButton.setAttribute("data-loading", "true");
    audioButton.style.opacity = "0.6";
    audioButton.style.pointerEvents = "none";

    fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Dictionary lookup failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Extract audio from dictionary API response
        // Try: Dictionary API audio → Speech Synthesis → No-Audio handler
        let audioSrc = null;
        if (data && Array.isArray(data) && data.length > 0) {
          for (let wordNo = 0; wordNo < data.length; wordNo++) {
            let audioFound = false;
            if (
              data[wordNo].phonetics &&
              Array.isArray(data[wordNo].phonetics) &&
              data[wordNo].phonetics.length > 0
            ) {
              for (const phonetic of data[wordNo].phonetics) {
                if (phonetic.audio) {
                  audioSrc = phonetic.audio;
                  audioFound = true;
                  break;
                }
              }
            }
            if (audioFound === true) {
              break;
            }
          }
        }
        if (audioSrc != null) {
          // Dictionary audio found: set speaker icon and attach audio handler
          audioButton.src = "static/speaker.png";
          let audio = new Audio(audioSrc);
          audio.addEventListener("canplay", function () {
            // Audio is ready to play: remove loading state
            audioButton.removeAttribute("data-loading");
            audioButton.style.opacity = "1";
            audioButton.style.pointerEvents = "auto";
          });
          audioButton.addEventListener(
            "click",
            function (event) {
              event.stopPropagation();
              event.preventDefault();
              if (audioButton.hasAttribute("data-loading")) {
                return;
              }
              audio.play();
            },
            false,
          );
        } else if (window.speechSynthesis) {
          // Fall back to speech synthesis
          audioButton.src = "static/speaker.png";
          audioButton.removeAttribute("data-loading");
          audioButton.style.opacity = "1";
          audioButton.style.pointerEvents = "auto";
          audioButton.addEventListener(
            "click",
            function (event) {
              event.stopPropagation();
              event.preventDefault();
              const utterance = new SpeechSynthesisUtterance(word);
              speechSynthesis.speak(utterance);
            },
            false,
          );
        } else {
          // No audio available: show no-audio icon and sound
          audioButton.removeAttribute("data-loading");
          audioButton.style.opacity = "1";
          audioButton.style.pointerEvents = "auto";
          createNoAudioButton(audioButton, true);
        }
      })

      .catch((error) => {
        // Failed: check for speech synthesis
        if (window.speechSynthesis) {
          audioButton.src = "static/speaker.png";
          audioButton.removeAttribute("data-loading");
          audioButton.style.opacity = "1";
          audioButton.style.pointerEvents = "auto";
          audioButton.addEventListener(
            "click",
            function (event) {
              event.stopPropagation();
              event.preventDefault();
              const utterance = new SpeechSynthesisUtterance(word);
              speechSynthesis.speak(utterance);
            },
            false,
          );
        } else {
          // No audio available: show no-audio icon and sound
          audioButton.removeAttribute("data-loading");
          audioButton.style.opacity = "1";
          audioButton.style.pointerEvents = "auto";
          createNoAudioButton(audioButton, true);
        }
      });
  }
}

/**
 * Process dictionary API response and populate popup with word definitions
 * Parses phonetics for audio, meanings by part-of-speech, and definitions
 * Handles missing data gracefully with fallback messages
 *
 * @param {Object} data - Dictionary API response object containing word data
 * @param {string} HTMLword - The word to display in popup header
 */
function popupText(data, HTMLword) {
  let words = [];
  if (data && Array.isArray(data) && data.length > 0) {
    for (let wordNo = 0; wordNo < data.length; wordNo++) {
      words.push({ word: data[wordNo].word, definitions: {} });
      if (
        data[wordNo].phonetics &&
        Array.isArray(data[wordNo].phonetics) &&
        data[wordNo].phonetics.length > 0
      ) {
        for (const phonetic of data[wordNo].phonetics) {
          if (phonetic.audio) {
            words[wordNo]["audio"] = phonetic.audio;
            break;
          } else {
            words[wordNo]["audio"] = null;
          }
        }
      }
      data[wordNo].meanings.forEach((meaning) => {
        words[wordNo]["definitions"][meaning.partOfSpeech] = [];
        meaning.definitions.forEach((definition) => {
          words[wordNo]["definitions"][meaning.partOfSpeech].push(
            definition.definition,
          );
        });
      });
    }
    generateText(words);
  } else {
    document.querySelector("#popup #text").innerHTML =
      "<br>No definition available, you may be able to search online to find one.";
    document.querySelector("#banner h2").innerHTML = HTMLword;
    let play = document.getElementById("play");
    if (play) {
      play = removeAllEventListeners(play);
      if (window.speechSynthesis) {
        play.src = "static/speaker.png";
        play.addEventListener("click", function (event) {
          event.stopPropagation();
          event.preventDefault();
          const utterance = new SpeechSynthesisUtterance(HTMLword);
          speechSynthesis.speak(utterance);
        });
      } else {
        // No speech synthesis: show no-audio handler
        createNoAudioButton(play, false);
      }
    }
  }
}

// ============================================================================
// UTILITY: DOM CLEANUP & INITIALIZATION
// ============================================================================

/**
 * Remove all event listeners from an element by cloning and replacing it
 * This ensures a clean state for re-attaching listeners
 *
 * @param {Element} element - The DOM element to clean
 * @return {Element} The newly cloned element with no event listeners
 */
function removeAllEventListeners(element) {
  if (!element || !element.parentNode) {
    return element;
  }
  const clone = element.cloneNode(true);
  element.parentNode.replaceChild(clone, element);
  return clone;
}

/**
 * Initialize all button handlers and font sizing on page load
 * Calls all main event listener setup functions in order
 */
function setupButtons() {
  const buttons = document.querySelectorAll(".auto-font-size");
  buttons.forEach((button) => {
    adjustFontSize(button);
  });
  onNextButtonClick();
  onHomeButtonClick();
  onDictButtonClick();
  onExitButtonClick();
}

/**
 * Load next question from database and update page UI
 * Handles difficulty-specific logic (easy = 2 answers, hard = 4 answers)
 * Resets button styles, populates answer options, and attachs audio handlers
 *
 * @async
 */
async function updateQuestion() {
  const difficulty = getDifficultyFromLocation();
  const data = await getQuestionDataFromDB(difficulty);
  document.getElementById("title-text").innerHTML = `
        Which ${
          difficulty === "easy" ? "word is" : "two words are"
        } most closely related to <b id="ans0"><span>${data.target}</span></b>?
      `;
  const numButtons = difficulty === "easy" ? 2 : 4;
  if (difficulty === "easy") {
    const button1 = document.querySelector("#ans3");
    const button2 = document.querySelector("#ans4");
    if (button1) {
      const container = document.getElementById("grid-container");
      const newDiv = document.createElement("div");
      container.replaceChild(newDiv, button1);
    }
    if (button2) {
      button2.remove();
    }
  }
  for (let i = 1; i <= numButtons; i++) {
    let button = document.querySelector(`#ans${i}`);
    // reset current button
    button.classList.remove("disabled");
    button.classList.remove("right");
    button.classList.remove("wrong");
    button.style.backgroundColor = "rgb(216, 233, 239)";
    // set text from json data
    let text = document.querySelector(`#ans${i} span`);
    text.innerHTML = data.options[i - 1];
    // check if correct
    if (data.correct_indexes.includes(i - 1)) {
      button.classList.add("right");
    } else {
      button.classList.add("wrong");
    }
  }
  const speakers = document.querySelectorAll(".audio-btn");
  for (const speaker of speakers) {
    removeAllEventListeners(speaker);
  }
  onSpeakerButtonClick(data.target, data.options);
  // enable next arrow
  document.querySelector(`#next`).classList.remove("disabled");
}

// ============================================================================
// EVENT LISTENERS: RESIZE & PAGE INITIALIZATION
// ============================================================================

/**
 * Window resize listener - recalculates font sizes when viewport changes
 * Maintains responsive text sizing for all auto-sized buttons
 */
window.addEventListener("resize", () => {
  const buttons = document.querySelectorAll(".auto-font-size");
  buttons.forEach((button) => {
    adjustFontSize(button);
  });
});

/**
 * Page initialization on DOM content loaded
 * Sets up initial question, audio, buttons, and game state
 * This is the main entry point for the question page
 */
document.addEventListener("DOMContentLoaded", async function () {
  adjustSizing();
  audio();
  await updateQuestion();
  mchoice();
  setupButtons();
});

/**
 * Keyboard event listener - handles Escape key to close popup
 * Escape key toggles the visibility of the definition popup
 */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const popup = document.getElementById("popup");
    if (popup.style.visibility === "visible") {
      hidePopup();
    }
  }
});
