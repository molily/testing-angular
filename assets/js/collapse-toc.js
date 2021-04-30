(function () {
  'use strict';

  function installCollapseTOC() {
    var chapterLinks = document.querySelectorAll('#toc-tree > li > a');
    for (var i = 0, l = chapterLinks.length; i < l; i++) {
      var chapterLink = chapterLinks[i];
      if (chapterLink.pathname !== location.pathname) {
        var ol = chapterLink.nextElementSibling;
        if (ol) {
          ol.className += ' collapsed';
        }
      }
    }
  }

  if (document.body.querySelectorAll && 'nextElementSibling' in document.body) {
    installCollapseTOC();
  }
})();
