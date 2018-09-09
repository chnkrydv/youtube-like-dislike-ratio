function addMaterialLink() {
  var link = document.createElement('link');
  link.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons');
  link.setAttribute('rel', 'stylesheet');

  document.head.appendChild(link);
}

function addStyle(){
  var style = document.createElement('style');
  var browserSpecificBarThickness = function(){
    if(navigator.userAgent.indexOf("Firefox") != -1 )  return `border-bottom: 2px solid #888;`;

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

function getSentimentCount(){
  likesCount = 1;
  dislikesCount = 1;
  var likes = Array.from(document.getElementsByTagName('yt-formatted-string'));
  likes.forEach( like => {
    var aria = like.getAttribute('aria-label');
    if(!aria) return;
    
    var ariaPhrase = aria && aria.split(' ');
    var firstWord = ariaPhrase.length && +ariaPhrase[0].split(',').join('');
    var count = isNaN(firstWord) ? 1 : firstWord;

    if(ariaPhrase && ariaPhrase.includes('likes')) likesCount = count;
    if(ariaPhrase && ariaPhrase.includes('dislikes')) dislikesCount = count;
  });

  if(dislikesCount > likesCount) return '1/' + Math.floor(dislikesCount/likesCount);

  return Math.floor(likesCount / dislikesCount);
}

function addUI() {
  var flex = document.getElementById('flex');
  var container = document.createElement('span');
  var icon = document.createElement('i');
  var ratio = document.createElement('span');
  
  flex.classList.add('ratio-container');
  container.classList.add('like-dislike-ratio');
  icon.classList.add('material-icons','like-dislike-icon');

  icon.innerText = 'thumbs_up_down';
  ratio.innerText = '' + getSentimentCount();

  container.appendChild(icon);
  container.appendChild(ratio);

  flex.appendChild(container);
}

function loadExtension() {
  addMaterialLink();
  addStyle();
  addUI();
}

setTimeout(loadExtension, 500);