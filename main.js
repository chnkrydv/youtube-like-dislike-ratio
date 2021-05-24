// START: Constants

var RENDERED_ELEMENT_ID = 'yt-like-dislike-ratio'
var RENDERED_ELEMENT_PARENT_CLASS = 'yt-like-dislike-ratio'
var RENDERED_ELEMENT_PARENT_QUERY_SELECTOR = '#info #flex'
var SENTIMENTS_TOOLTIP_NODE_QUERY_SELECTOR = 'ytd-sentiment-bar-renderer #tooltip'

// END: Constants


// START: preparing extension's UI with style
function addStyleToHead() {
  var style = document.createElement('style');
  var browserSpecificBarThickness = function () {
    if (navigator.userAgent.indexOf("Firefox") != -1) return `border-bottom: 2px solid #888;`;

    return `border-bottom: 2.5px solid #888;`;
  }

  var styleText = `
  .${RENDERED_ELEMENT_PARENT_CLASS} {
    display: grid;
    justify-items: end;
  }
  
  #${RENDERED_ELEMENT_ID} {
    color: #888;
    font-size: 13px;
    font-weight: 500;
    padding: 6px;
    padding-bottom: 15px;
    margin-right: 20px;
    margin-bottom: -18px;
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

function getNumFromString(numString){
  return +numString.replace(/[,.\s]/g, '')
}

function getRatioString(likes, dislikes){
  var l2dRatio = (likes/dislikes).toFixed()
  var d2lRatio = (likes/dislikes).toFixed()
  if(!likes || !dislikes) return `${likes} : ${dislikes}`
  else if(likes < dislikes) return `1 : ${d2lRatio}`
  else return `${l2dRatio} : 1`
}

function getSentimentsTooltipNode(){
  return document.querySelector(SENTIMENTS_TOOLTIP_NODE_QUERY_SELECTOR)
}

function getRatioFromSentimentsTooltip(setimentsTooltipNode) {
  console.log(setimentsTooltipNode)
  console.log(setimentsTooltipNode.innerText.trim())

  var sentimentsTextArr = setimentsTooltipNode.innerText.trim().split('/')
  var likesStr = sentimentsTextArr[0]
  var dislikesStr = sentimentsTextArr[1]
  var likesCount = getNumFromString(likesStr);
  var dislikesCount = getNumFromString(dislikesStr);

  var ratioString = getRatioString(likesCount, dislikesCount)
  console.log(ratioString)

  return ratioString
}
// END: finding and getting sentiment nodes and calculating counts from them




// START: creating, updating and deleting extension's UI
function createAndGetUINode(setimentsTooltipNode) {
  var uiElementNode = document.createElement('span')
  var ratioString = getRatioFromSentimentsTooltip(setimentsTooltipNode)
  
  uiElementNode.setAttribute('id', RENDERED_ELEMENT_ID)
  uiElementNode.innerText = ratioString

  return uiElementNode;
}

function flushStaleUI(){
  var element = document.getElementById(RENDERED_ELEMENT_ID)
  if (element) element.parentNode.removeChild(element)
}

function updateRenderedUI(setimentsTooltipNode) {
  var updatedUINode = createAndGetUINode(setimentsTooltipNode)
  var parentNode = document.querySelector(RENDERED_ELEMENT_PARENT_QUERY_SELECTOR)
  if(!parentNode) return
  
  flushStaleUI()
  parentNode.classList.add(RENDERED_ELEMENT_PARENT_CLASS)
  parentNode.appendChild(updatedUINode);
}
// END: creating, updating and deleting extension's UI




// START: observer logic and using it to find and observe sentiment nodes when YouTube page loads
function triggerCallbackOnNodeMutation(node, callback){
  var config = { attributes: true, childList: true, subtree: true };
  
  var observer = new MutationObserver(callback);
  observer.observe(node, config);
}

function findAndObserveSentimentsNode(documentBodyMutations, documentBodyObserver){
  for (var mutation of documentBodyMutations) {
    if (mutation.type == 'attributes') {
      var setimentsTooltipNode = getSentimentsTooltipNode()
      if(setimentsTooltipNode) {
        documentBodyObserver.disconnect();
  
        updateRenderedUI(setimentsTooltipNode);
        break;
      }
    }
  }
}
// END: observer logic and using it to find and observe sentiment nodes when YouTube page loads




// START: finally UI updator, which is composed of above code is called
function runUiUpdater(){
  triggerCallbackOnNodeMutation(document.body, findAndObserveSentimentsNode)
}

function loadExtension() {
  addStyleToHead();
  runUiUpdater();
}
// END: finally UI updator, which is composed of above code is called




// START: extension code executed as soon as content_script calls it
setTimeout(loadExtension, 0);
// END: extension code executed as soon as content_script calls it