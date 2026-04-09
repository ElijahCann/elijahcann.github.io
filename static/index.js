let activeAudio = null;

function onAudioClick() {
  let audioButtons = document.querySelectorAll('.audio-btn');

  for (let index = 0; index < audioButtons.length; index++) {
    // correlate button and audio
    const button = audioButtons[index];
    const audio = new Audio(`../static/slideReading${index}.mp3`);

    button.addEventListener('click', function (event) {
      // if not already playing
      // if clicked audio already playing
      if (activeAudio && activeAudio.index === index) {
        // pause and reset
        activeAudio.audio.pause();
        activeAudio.audio.currentTime = 0;
        activeAudio = null;
        return;
      } else {
        // pause and reset
        if (activeAudio) {
          activeAudio.audio.pause();
          activeAudio.audio.currentTime = 0;
        }
      }
      //play
      audio.play();
      activeAudio = { index, audio };
      event.preventDefault();
    });
  }
}

function onCarouselClick(button) {
  let clickAudio = new Audio('../static/click.mp3');
  // get index of target
  let id = button.id;
  id = id[id.length - 1];
  // set correlating slide
  let nextSlide = document.querySelector(`#carousel-slide${id}`);

  button.addEventListener('click', function (event) {
    if (button.classList.contains('disabled')) {
      return;
    }
    if (activeAudio) {
      // clear playing audio
      activeAudio.audio.pause();
      activeAudio.audio.currentTime = 0;
      activeAudio = null;
    }
    event.stopPropagation();

    // pause audio
    pauseAllAudio();
    // get index of active
    let activeSlide = document.querySelector('.carousel-container .active');
    let activeBtn = document.querySelector('.carousel-indicators .active');
    let activeIndex = activeSlide.id;
    activeIndex = activeIndex[activeIndex.length - 1];
    // if next slide to right, scroll right
    if (id > activeIndex) {
      clickAudio.play();
      scrollRight(button, nextSlide, activeBtn, activeSlide);
      // else scroll left
      // if same slide clicked as active, do nothing
    } else if (id < activeIndex) {
      clickAudio.play();
      scrollLeft(button, nextSlide, activeBtn, activeSlide);
    }
  });
}

function onPlayButtonClick() {
  // get elements
  const play1 = document.querySelector(`#Level1`);
  const play2 = document.querySelector(`#Level2`);

  // on click, navigate to the static question page with difficulty
  play1.addEventListener('click', function (event) {
    window.location.href = 'question.html?difficulty=easy';
    event.preventDefault();
  });

  play2.addEventListener('click', function (event) {
    window.location.href = 'question.html?difficulty=hard';
    event.preventDefault();
  });
}

function onSWOWClick() {
  const button = document.querySelector('#SWOW-link');
  // on click open page on blank tab
  button.addEventListener('click', function (event) {
    window.open('https://smallworldofwords.org/en', '_blank');
  });
}

function pauseAllAudio() {
  var allAudioElements = document.querySelectorAll('audio');
  allAudioElements.forEach(function (audio) {
    audio.pause();
  });
}

function scrollLeft(nextBtn, nextSlide, activeBtn, activeSlide) {
  // set all buttons to inactive
  toggleButtons();
  // set active slide to move away
  activeSlide.classList.remove('active');
  if (activeBtn) {
    activeBtn.classList.remove('active');
  }
  activeSlide.classList.add('after');

  // prepare next slide
  nextSlide.classList.remove('inactive');
  nextSlide.classList.add('becoming-active-from-right');

  setTimeout(() => {
    // change slide from becoming active to active
    nextSlide.classList.remove('becoming-active-from-right');
    nextSlide.classList.add('active');
    // change btn to active
    nextBtn.classList.add('active');

    // make old slide inactive after transition
    setTimeout(() => {
      // activate all buttons
      toggleButtons();
      // reset slide
      activeSlide.classList.add('inactive');
      activeSlide.classList.remove('after');
    }, 1000);
  });
}

function scrollRight(nextBtn, nextSlide, activeBtn, activeSlide) {
  // set all buttons to inactive
  toggleButtons();
  // set active slide to move away
  activeSlide.classList.remove('active');
  if (activeBtn) {
    activeBtn.classList.remove('active');
  }
  activeSlide.classList.add('before');

  // prepare next slide
  nextSlide.classList.remove('inactive');
  nextSlide.classList.add('becoming-active-from-left');

  setTimeout(() => {
    // change slide from becoming active to active
    nextSlide.classList.remove('becoming-active-from-left');
    nextSlide.classList.add('active');
    // change btn to active
    nextBtn.classList.add('active');

    // make old slide inactive after transition
    setTimeout(() => {
      // activate all buttons
      toggleButtons();
      activeSlide.classList.add('inactive');
      activeSlide.classList.remove('before');
    }, 1000);
  });
}

function setupButtons() {
  // init carousel buttons
  var buttons = document.querySelectorAll('.carousel-indicator');
  buttons.forEach(function (button) {
    onCarouselClick(button);
  });
  onPlayButtonClick();
  onSWOWClick();
  onAudioClick();
}

function toggleButtons() {
  // enable/ disable all buttons
  var buttons = document.querySelectorAll('.carousel-indicator');
  buttons.forEach(function (button) {
    button.classList.toggle('disabled');
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupButtons();
});
