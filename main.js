console.log('extension loaded');


// START: preparing extension's UI with style
function addMaterialLink() {
  var link = document.createElement('link');
  link.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons');
  link.setAttribute('rel', 'stylesheet');

  document.head.appendChild(link);
}

function addStyleToHead() {
  var style = document.createElement('style');
  var browserSpecificBarThickness = function () {
    if (navigator.userAgent.indexOf("Firefox") != -1) return `border-bottom: 2px solid #888;`;

    return `border-bottom: 2.5px solid #888;`;
  }

  var styleText = `
  .ratio-container {
    display: grid;
    justify-items: end;
  }

  .like-dislike-icon{
    font-size: 22px
  }
  
  .like-dislike-ratio {
    color: #888;
    display: grid;
    grid-template-columns: 35px 25px;
    align-items: center;
    justify-items: center;
    font-size: 13px;
    font-weight: 500;
    padding-bottom: 10px;
    margin-right: 20px;
    margin-bottom: -22px;
    ${browserSpecificBarThickness()}
  }
  `;

  style.innerText = styleText;

  document.head.appendChild(style);
}
// END: preparing extension's UI with style




// START: finding and getting sentiment nodes and calculating counts from them
function getSentimentNodes(){
  var likes = null;
  var dislikes = null;
  var similar = Array.from(document.getElementsByTagName('yt-formatted-string'));

  similar.forEach(node => {
    var ariaPhrase = node.getAttribute('aria-label');
    if (!ariaPhrase) return;

    var ariaPhraseArr = ariaPhrase && ariaPhrase.split(' ');

    if (ariaPhraseArr && (ariaPhraseArr.includes('likes') || ariaPhraseArr.includes('like'))) likes = node;
    if (ariaPhraseArr && (ariaPhraseArr.includes('dislikes') || ariaPhraseArr.includes('dislike'))) dislikes = node;
  });

  return likes && dislikes && { likes, dislikes };
}

function getCountFromPhrase(phrase){
  var phraseArr = phrase.split(' ');
  var firstWord = phraseArr.length && +phraseArr[0].split(',').join('');
  
  return isNaN(firstWord) ? 1 : firstWord;
}

function getSentimentCount() {
  var sentiments = getSentimentNodes();
  if(!sentiments) return console.log('returning as no sentiment nodes detected as of') || 0.0;

  var likesAria = sentiments.likes.getAttribute('aria-label');
  var dislikesAria = sentiments.dislikes.getAttribute('aria-label');

  var likesCount = getCountFromPhrase(likesAria) || 1;
  var dislikesCount = getCountFromPhrase(dislikesAria) || 1;

  if (dislikesCount > likesCount) return '1/' + Math.floor(dislikesCount / likesCount);

  return Math.floor(likesCount / dislikesCount);
}
// END: finding and getting sentiment nodes and calculating counts from them




// START: creating, updating and deleting extendion's UI
function createUI() {
  var ratioCount = getSentimentCount();
  var container = document.createElement('span');
  var icon = document.createElement('i');
  var ratio = document.createElement('span');

  container.setAttribute('id', 'yt-like-dislike-ratio')
  container.classList.add('like-dislike-ratio');
  icon.classList.add('material-icons', 'like-dislike-icon');

  icon.innerText = 'thumbs_up_down';
  ratio.innerText = isNaN(ratioCount) ? '' : ratioCount.toString();

  container.appendChild(icon);
  container.appendChild(ratio);

  return container;
}

function updateUI() {
  var ui = document.getElementById('yt-like-dislike-ratio');
  if (ui) deleteUI(ui);

  var flex = document.getElementById('flex');
  if(!flex) return;
  flex.classList.add('ratio-container');

  flex.appendChild(createUI());
}

function deleteUI(ui) {
  ui.parentNode.removeChild(ui);
}
// END: creating, updating and deleting extendion's UI




// START: observer logic and using it to find and observe sentiment nodes when YouTube page loads
function observeNode(node, callback){
  var config = { attributes: true, childList: true, subtree: true };
  
  var observer = new MutationObserver(callback);
  observer.observe(node, config);
  console.log(node.tagName + ' observer started');
}

function updateSentiments(sentimentMutationsList){
  for (var mutation of sentimentMutationsList) {
    if (mutation.type == 'attributes' && mutation.attributeName === "aria-label") {
      updateUI();
    }
  }
}

function startObservingSentiments(){
  console.log('started observing sentiments');
  var sentimentNodes = getSentimentNodes();
  updateUI();
  if(sentimentNodes){
    observeNode(sentimentNodes.likes, updateSentiments);
    observeNode(sentimentNodes.dislikes, updateSentiments);
  }
}

function observeSentimentsAfterFinding(documentBodyMutations, bodyObserver){
  for (var mutation of documentBodyMutations) {
    if (mutation.type == 'attributes') {
      if(getSentimentNodes()) {
        bodyObserver.disconnect(console.log('disconnect triggered'));
  
        startObservingSentiments();
        break;
      }
    }
  }
}
// END: observer logic and using it to find and observe sentiment nodes when YouTube page loads




// START: finally UI updator, which is composed of above code is called
function runUiUpdater(){
  console.log('ui updater invoked to run')
  observeNode(document.body, observeSentimentsAfterFinding)
  console.log('called observer');
}

function loadExtension() {
  addMaterialLink();
  addStyleToHead();
  runUiUpdater();
}
// END: finally UI updator, which is composed of above code is called




// START: extension code executed as soon as content_script calls it
setTimeout(loadExtension, 0);
// END: extension code executed as soon as content_script calls it