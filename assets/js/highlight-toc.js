(function () {
  'use strict';

  /** @type {HTMLOListElement} */
  var tocTree;
  /** @type {HTMLHeadingElement[]} */
  var headings;

  /** @type {HTMLAnchorElement} */
  var currentTocLink;
  /** @type {IntersectionObserver} */
  var intersectionObserver;

  /** @type {Set<HTMLHeadingElement>} */
  var intersectingHeadings;

  function headingIntersect(entries) {
    if (!matchMedia('screen and (min-width: 55rem)').matches) {
      return;
    }
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        intersectingHeadings.add(entry.target);
      } else {
        intersectingHeadings.delete(entry.target);
      }
    });
    var firstIntersectingHeading = intersectingHeadings.values().next().value;
    var firstEntry = entries[0];
    var intersectingHeading;
    if (firstIntersectingHeading) {
      intersectingHeading = firstIntersectingHeading;
    } else if (
      firstEntry.boundingClientRect &&
      firstEntry.boundingClientRect.y > 0
    ) {
      /* Scrolling upwards: Focus previous heading */
      var index = Array.from(headings).findIndex(function (candidate) {
        return candidate === firstEntry.target;
      });
      if (index > 0) {
        intersectingHeading = headings[index - 1];
      }
    }
    if (intersectingHeading) {
      if (currentTocLink) {
        currentTocLink.classList.remove('active');
      }
      var id = intersectingHeading.id;
      var tocLinks = Array.from(tocTree.querySelectorAll('a'));
      var link = tocLinks.find(function (linkCandidate) {
        return linkCandidate.hash === '#' + id;
      });
      if (link) {
        link.classList.add('active');
        link.scrollIntoView({ block: 'nearest' });
        currentTocLink = link;
      }
    }
  }

  function installHighlightToc() {
    intersectingHeadings = new Set()
    tocTree = document.getElementById('toc-tree');
    headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    intersectionObserver = new IntersectionObserver(headingIntersect, {
      root: null,
      rootMargin: '0px 0px -40% 0px',
      threshold: 0,
    });

    Array.from(headings)
      .filter(function (heading) {
        return heading.id !== 'toc-heading';
      })
      .forEach(function (heading) {
        intersectionObserver.observe(heading);
      });
  }

  if (
    document.getElementById &&
    document.querySelectorAll &&
    window.IntersectionObserver &&
    window.matchMedia &&
    document.body.classList &&
    document.body.scrollIntoView &&
    Array.from &&
    Array.prototype.find &&
    Array.prototype.findIndex &&
    Array.prototype.filter &&
    Array.prototype.forEach &&
    String.prototype.endsWith &&
    window.Set
  ) {
    installHighlightToc();
  }
})();
