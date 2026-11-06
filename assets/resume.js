(function () {
  'use strict';

  var button = document.getElementById('print-resume');
  if (button) {
    button.addEventListener('click', function () {
      window.print();
    });
  }
})();
