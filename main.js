// START: Constants

var RENDERED_ELEMENT_ID = 'yt-like-dislike-ratio'
var RENDERED_ELEMENT_PARENT_CLASS = 'yt-like-dislike-ratio'
var RENDERED_ELEMENT_PARENT_QUERY_SELECTOR = '#info #flex'
var SENTIMENTS_TOOLTIP_NODE_QUERY_SELECTOR = 'ytd-sentiment-bar-renderer #tooltip'
var LIKES_COUNT_NODE_QUERY_SELECTOR = 'ytd-menu-renderer yt-formatted-string'

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
function getNumFromString(numString){
  return +numString.replace(/[,.\s]/g, '')
}

function getRatioString(likes, dislikes){
  if(!likes || !dislikes) return `${likes} : ${dislikes}`

  var l2dRatio = (likes/dislikes).toFixed()
  var d2lRatio = (dislikes/likes).toFixed()
  if(likes < dislikes) return `1 : ${d2lRatio}`
  else return `${l2dRatio} : 1`
}

function getRatioFromSentimentsTooltip(setimentsTooltipNode) {
  var sentimentsTooltipText = setimentsTooltipNode.innerText.trim()
  if(!sentimentsTooltipText) return ''

  var sentimentsTooltipTextArr = sentimentsTooltipText.split('/')
  var likesStr = sentimentsTooltipTextArr[0]
  var dislikesStr = sentimentsTooltipTextArr[1]
  var likesCount = getNumFromString(likesStr);
  var dislikesCount = getNumFromString(dislikesStr);

  var ratioString = getRatioString(likesCount, dislikesCount)

  return ratioString
}
// END: finding and getting sentiment nodes and calculating counts from them




// START: creating, updating and deleting extension's UI
function createAndGetUINode(setimentsTooltipNode) {
  var uiElementNode = document.createElement('span')
  var ratioString = getRatioFromSentimentsTooltip(setimentsTooltipNode)

  if(!ratioString) return
  
  uiElementNode.setAttribute('id', RENDERED_ELEMENT_ID)
  uiElementNode.innerText = ratioString

  return uiElementNode;
}

function flushStaleUI(){
  var element = document.getElementById(RENDERED_ELEMENT_ID)
  if (element) element.parentNode.removeChild(element)
}

function updateRenderedUI(setimentsTooltipNode) {
  flushStaleUI()

  var updatedUINode = createAndGetUINode(setimentsTooltipNode)
  if(!updatedUINode) return
  var parentNode = document.querySelector(RENDERED_ELEMENT_PARENT_QUERY_SELECTOR)
  if(!parentNode) return
  
  parentNode.classList.add(RENDERED_ELEMENT_PARENT_CLASS)
  parentNode.appendChild(updatedUINode);
}
// END: creating, updating and deleting extension's UI




// START: observer logic and using it to find and observe sentiment nodes when YouTube page loads
function triggerCallbackOnNodeMutation(node, callback){
  if(!(node instanceof Node)) return

  var config = { attributes: true, childList: true, subtree: true };
  var observer = new MutationObserver(callback);
  observer.observe(node, config);
}

function startObservingSentiments(setimentsTooltipNode){
  var likesCountNode = document.querySelector(LIKES_COUNT_NODE_QUERY_SELECTOR)
  updateRenderedUI(setimentsTooltipNode)
  triggerCallbackOnNodeMutation(likesCountNode, function(likesCountNodeMutations){
    for (var mutation of likesCountNodeMutations) {
      if (mutation.type == 'attributes' && mutation.attributeName === "aria-label") {
        updateRenderedUI(setimentsTooltipNode)
      }
    }
  });
}

function findAndObserveSentimentsNode(documentBodyMutations, documentBodyObserver){
  for (var mutation of documentBodyMutations) {
    if (mutation.type == 'attributes') {
      var setimentsTooltipNode = document.querySelector(SENTIMENTS_TOOLTIP_NODE_QUERY_SELECTOR)
      if(setimentsTooltipNode) {
        documentBodyObserver.disconnect();
  
        startObservingSentiments(setimentsTooltipNode);
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