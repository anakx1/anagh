(function () {
  'use strict';

  var EMAIL = ['kakarotthebeast1', 'gmail.com'].join('@');
  Array.prototype.forEach.call(document.querySelectorAll('.email-link'), function (a) {
    a.href = 'mailto:' + EMAIL;
  });

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('theme-toggle');
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function syncThemeUI() {
    if (!themeBtn) return;
    var isDark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    themeBtn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    if (metaTheme) metaTheme.setAttribute('content', isDark ? '#07080b' : '#f6f7f9');
  }

  syncThemeUI();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeUI();
    });
  }

  /* ---------- Header, mobile menu, scroll spy ---------- */
  var header = document.getElementById('site-header');
  var menuBtn = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav-links');
  var navAnchors = nav ? Array.prototype.slice.call(nav.querySelectorAll('a')) : [];
  var spySections = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));

  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Toggle navigation');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Toggle navigation');
    });

    navAnchors.forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  function syncActiveNav() {
    if (!spySections.length) return;
    var y = window.scrollY + 130;
    var current = '';
    spySections.forEach(function (section) {
      if (section.offsetTop <= y) current = section.id;
    });
    navAnchors.forEach(function (a) {
      var isActive = current && a.getAttribute('href') === '#' + current;
      a.classList.toggle('is-active', !!isActive);
      if (isActive) {
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    syncActiveNav();
  }

  var ticking = false;
  function requestScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Command lab tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var cheatCards = Array.prototype.slice.call(document.querySelectorAll('.cheat-card'));

  var cheatCounts = {};
  cheatCards.forEach(function (card) {
    var cat = card.getAttribute('data-cat');
    cheatCounts[cat] = (cheatCounts[cat] || 0) + 1;
  });
  tabs.forEach(function (tab) {
    var count = tab.querySelector('span');
    if (!count) return;
    var cat = tab.getAttribute('data-cat');
    count.textContent = cat === 'all' ? cheatCards.length : (cheatCounts[cat] || 0);
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var cat = tab.getAttribute('data-cat');
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-pressed', String(active));
      });
      cheatCards.forEach(function (card) {
        var show = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- Copy snippets ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
    btn.addEventListener('click', function () {
      var code = btn.closest('.code') && btn.closest('.code').querySelector('pre code');
      if (!code) return;
      var text = code.textContent.replace(/\s+$/, '');
      var done = function () {
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = 'Copy';
        }, 1600);
      };
      var fail = function () {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(area);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        fail();
      }
    });
  });

  /* ---------- Interactive terminal ---------- */
  var terminalCard = document.getElementById('terminal-card');
  var terminalBody = document.getElementById('terminal-body');
  var terminalHistory = document.getElementById('terminal-history');
  var termForm = document.getElementById('term-form');
  var terminalInput = document.getElementById('terminal-input');

  if (!terminalCard || !terminalBody || !terminalHistory || !termForm || !terminalInput) return;

  var commandHistory = [];
  var historyIndex = 0;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function out(html) {
    var el = document.createElement('div');
    el.className = 'term-out';
    el.innerHTML = html;
    return el;
  }

  function promptRow(cmd) {
    var row = document.createElement('div');
    row.className = 'term-cmdline';
    row.innerHTML = '<span class="p-user">anagh@rhel</span><span class="p-sep">:</span>' +
      '<span class="p-path">~</span><span class="p-sym">$</span> ' +
      '<span class="term-cmd">' + escapeHtml(cmd) + '</span>';
    return row;
  }

  function profile() {
    return [
      '[CANDIDATE_PROFILE]',
      'Name          : V P ANAGH UTHAMAN',
      'Track         : RHCSA &amp; RHCE (RHCE study completed)',
      'Training      : RHEL 10 Rapid Track course (completed)',
      'Target Exam   : EX200 (RHEL v10 Edition)',
      'Status        : Active preparation &amp; lab testing',
      'Focus Areas   : systemd units, storage (LVM/VDO), SELinux targeted policy, firewalld, Bash automation'
    ].join('\n');
  }

  var COMMANDS = {
    help: function () {
      return '<span class="t-cyan">AVAILABLE COMMANDS</span>\n' +
        '  <span class="t-green">whoami</span>     profile &amp; mission\n' +
        '  <span class="t-green">ex200</span>      RHCSA domains &amp; lab page link\n' +
        '  <span class="t-green">skills</span>     technical competencies\n' +
        '  <span class="t-green">projects</span>   hands-on labs and repos\n' +
        '  <span class="t-green">rockylab</span>   Rocky Linux 9 case study\n' +
        '  <span class="t-green">arch</span>       Ansible 3-node topology\n' +
        '  <span class="t-green">certs</span>      certification roadmap\n' +
        '  <span class="t-green">ls -la</span>     workspace files\n' +
        '  <span class="t-green">cat &lt;file&gt;</span> read a file (try <span class="t-amber">/etc/exam-tracker.conf</span>)\n' +
        '  <span class="t-green">sudo &lt;cmd&gt;</span> try a privileged command\n' +
        '  <span class="t-green">history</span>    command history\n' +
        '  <span class="t-green">date</span>       current date\n' +
        '  <span class="t-green">clear</span>      clear the screen';
    },
    whoami: function () {
      return '<strong>V P ANAGH UTHAMAN</strong>\n' +
        'Role    : Linux Systems Administrator (in training)\n' +
        'Focus   : RHEL administration, Bash &amp; Ansible automation, AWS networking basics\n' +
        'Current : Intensive preparation for Red Hat EX200 (RHEL v10 Edition)\n' +
        'GitHub  : <a href="https://github.com/an9gh" target="_blank" rel="noopener">github.com/an9gh</a>\n' +
        'LinkedIn: <a href="https://in.linkedin.com/in/anaghvp" target="_blank" rel="noopener">linkedin.com/in/anaghvp</a>\n' +
        'Email   : <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>';
    },
    ex200: function () {
      return '<strong class="t-red">EX200 (RHEL 10) OBJECTIVE DOMAINS</strong>\n' +
        '  1. Essential tools     redirection, grep, find, tar, links, permissions\n' +
        '  2. Shell scripting     arguments, tests, conditionals, loops\n' +
        '  3. Storage &amp; LVM       partitions, LVM, snapshots, XFS/EXT4, NFS, Stratis\n' +
        '  4. SELinux             modes, contexts, booleans, AVC diagnosis\n' +
        '  5. systemd &amp; boot      services, timers, cron/at, journal, rd.break, grubby\n' +
        '  6. Users &amp; security    accounts, groups, sudoers, SSH keys, ACLs, umask\n' +
        '  7. Networking          nmcli, hostname, firewalld, scp/rsync, httpd\n' +
        '  8. Packages &amp; processes dnf repos, kernel updates, tuning, signals\n\n' +
        '<span class="t-cyan">[lab page]</span> <a href="lab.html">open the EX200 command lab</a>.';
    },
    skills: function () {
      return '<strong>Linux &amp; systems</strong>\n' +
        '  RHEL 8/9/10, SELinux, systemd, LVM &amp; Stratis, firewalld, nmcli,\n' +
        '  users &amp; ACLs, Bash scripting\n\n' +
        '<strong>Cloud &amp; automation</strong>\n' +
        '  Ansible, AWS (VPC, subnets, Elastic IP, Lambda), Git/GitHub,\n' +
        '  shell automation, cron &amp; timers\n\n' +
        '<strong>Operations</strong>\n' +
        '  troubleshooting, log analysis, root cause analysis, system recovery,\n' +
        '  hardening, documentation';
    },
    certs: function () {
      return '<strong class="t-cyan">CERTIFICATIONS &amp; ROADMAP</strong>\n' +
        '  [IN PROGRESS] EX200 - Red Hat Certified System Administrator (RHEL 10)\n' +
        '  [COMPLETED]   RHEL 10 Rapid Track course\n' +
        '  [STUDIED]     RHCE - Red Hat Certified Engineer (Ansible automation)\n' +
        '  [FOUNDATIONS] AWS - VPC, subnets, Elastic IP, networking basics, Lambda';
    },
    projects: function () {
      return '<strong class="t-cyan">GITHUB REPOSITORIES &amp; LABS</strong>\n\n' +
        '  <span class="t-green">1. ansible-works</span> <span class="t-red">[RHCE track]</span>\n' +
        '     Multi-node KVM automation (1 control + 2 managed nodes)\n' +
        '     <a href="https://github.com/an9gh/ansible-works" target="_blank" rel="noopener">github.com/an9gh/ansible-works</a>\n\n' +
        '  <span class="t-green">2. rhel-root-password-recovery</span> <span class="t-green">[RHCSA / EX200]</span>\n' +
        '     GRUB rd.break recovery and SELinux relabeling\n' +
        '     <a href="https://github.com/an9gh/rhel-root-password-recovery" target="_blank" rel="noopener">github.com/an9gh/rhel-root-password-recovery</a>\n\n' +
        '  <span class="t-green">3. bash-practice</span> <span class="t-amber">[Automation]</span>\n' +
        '     Sysadmin scripts, user audits, health checks, cron jobs\n' +
        '     <a href="https://github.com/an9gh/bash-practice" target="_blank" rel="noopener">github.com/an9gh/bash-practice</a>\n\n' +
        '  <span class="t-green">4. rocky-linux-lab</span> <span class="t-cyan">[Case study]</span>\n' +
        '     Sticky bit, rsyslog, sudoers expiry, xrdp log troubleshooting\n' +
        '     <a href="https://www.linkedin.com/posts/anaghvp_linux-rhcsa-rockylinux-activity-7519253979063549952-A6JP" target="_blank" rel="noopener">View the LinkedIn post</a>';
    },
    rockylab: function () {
      return '<strong class="t-cyan">LAB CASE STUDY: ROCKY LINUX 9 ENTERPRISE CHALLENGE</strong>\n' +
        'Host environment : KVM / virt-manager on Ubuntu\n' +
        'Target guest VM  : Rocky Linux 9 (RHEL 9 binary compatible)\n\n' +
        '<strong class="t-green">CORE OBJECTIVES IMPLEMENTED</strong>\n' +
        '  - Static IP &amp; NetworkManager configuration with active firewalld\n' +
        '  - User provisioning with passwordless sudo &amp; account expiry\n' +
        '  - Multi-user collaboration directory with sticky bit (1777)\n' +
        '  - System logging pipelines configured via rsyslog\n' +
        '  - GNOME desktop paired with the xrdp remote desktop service\n\n' +
        '<strong class="t-red">TROUBLESHOOTING &amp; ROOT CAUSE ANALYSIS</strong>\n' +
        '  Symptom     : xrdp session failed - "X server could not be started"\n' +
        '  Investigation: inspected journalctl -u xrdp and /var/log/xrdp.log\n' +
        '  Root cause  : missing X11 backend package (xorgxrdp)\n' +
        '  Resolution  : installed the package, reloaded systemd, desktop restored\n\n' +
        'LinkedIn : <a href="https://www.linkedin.com/posts/anaghvp_linux-rhcsa-rockylinux-activity-7519253979063549952-A6JP" target="_blank" rel="noopener">Read the full case study</a>';
    },
    arch: function () {
      return '<strong class="t-cyan">ANSIBLE 3-NODE KVM LAB TOPOLOGY</strong>\n\n' +
        '  +---------------------------------------------------------+\n' +
        '  |        KVM / virt-manager subnet 192.168.122.0/24        |\n' +
        '  +----------------------------+----------------------------+\n' +
        '                               |\n' +
        '              +----------------+----------------+\n' +
        '              |      Ansible Control Node       |\n' +
        '              |  192.168.122.10 (Ubuntu)        |\n' +
        '              |  ansible-playbook / id_ed25519  |\n' +
        '              +--------+----------------+-------+\n' +
        '                       |                |\n' +
        '        passwordless   |                |   passwordless\n' +
        '        SSH, key auth  |                |   SSH, key auth\n' +
        '                       v                v\n' +
        '        +-------------------+    +-------------------+\n' +
        '        |   Managed Node 1  |    |   Managed Node 2  |\n' +
        '        |   192.168.122.21  |    |   192.168.122.22  |\n' +
        '        |   user: automation|    |   user: automation|\n' +
        '        |   sudo NOPASSWD   |    |   sudo NOPASSWD   |\n' +
        '        +-------------------+    +-------------------+';
    },
    ls: function (args) {
      if (args && (args.indexOf('-la') > -1 || args.indexOf('-l') > -1 || args.indexOf('-a') > -1)) {
        return 'total 44\n' +
          'drwxr-xr-x. 4 anagh anagh 4096 Nov  2 16:30 .\n' +
          'drwxr-xr-x. 3 root  root  4096 Nov  1 00:00 ..\n' +
          'drwxr-xr-x. 3 anagh anagh 4096 Nov  2 16:18 .github\n' +
          '-rw-r--r--. 1 anagh anagh   26 Nov  2 15:54 .gitignore\n' +
          '-rw-r--r--. 1 anagh anagh  321 Nov  2 15:54 .htmlvalidate.json\n' +
          '-rw-r--r--. 1 anagh anagh 1433 Nov  2 15:54 404.html\n' +
          '-rw-r--r--. 1 anagh anagh  646 Nov  2 15:54 README.md\n' +
          '-rw-r--r--. 1 anagh anagh 62360 Nov  2 16:30 index.html\n' +
          'drwxr-xr-x. 2 anagh anagh 4096 Nov  2 16:18 ansible-works\n' +
          'drwxr-xr-x. 2 anagh anagh 4096 Nov  2 16:18 bash-practice\n' +
          'drwxr-xr-x. 2 anagh anagh 4096 Nov  2 16:18 rhel-root-password-recovery';
      }
      return '404.html  README.md  index.html  ansible-works  bash-practice  rhel-root-password-recovery';
    },
    cat: function (args) {
      var file = args && args[0];
      if (file === '/etc/exam-tracker.conf' || file === 'tracker') return profile();
      if (file === 'contact.txt' || file === 'contact') {
        return 'Name     : V P ANAGH UTHAMAN\n' +
          'GitHub   : https://github.com/an9gh\n' +
          'LinkedIn : https://in.linkedin.com/in/anaghvp\n' +
          'Email    : ' + EMAIL + '\n' +
          'Hosting  : GitHub Pages';
      }
      if (!file) return 'cat: missing file operand. Try \'cat /etc/exam-tracker.conf\' or \'cat contact.txt\'';
      return 'cat: ' + escapeHtml(file) + ': No such file or directory';
    },
    echo: function (args) {
      return escapeHtml((args || []).join(' '));
    },
    sudo: function () {
      return '[sudo] password for anagh: *******\n' +
        '<span class="t-red">anagh is not in the sudoers file.</span> This incident will be reported to security@rhel. (Try exploring without root!)';
    },
    history: function () {
      if (!commandHistory.length) return '    1  help';
      return commandHistory.map(function (c, i) {
        return '  ' + String(i + 1).padStart(3, ' ') + '  ' + escapeHtml(c);
      }).join('\n');
    },
    date: function () {
      return new Date().toString();
    },
    clear: function () {
      terminalHistory.innerHTML = '';
      return null;
    }
  };

  function resolveCommand(cmd) {
    if (cmd === 'topology') return 'arch';
    if (cmd === 'labs') return 'ex200';
    if (cmd === 'casestudy') return 'rockylab';
    return cmd;
  }

  function executeCommand(rawInput) {
    var trimmed = String(rawInput).trim();
    if (!trimmed) return;

    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    terminalHistory.appendChild(promptRow(trimmed));

    var parts = trimmed.split(/\s+/);
    var cmd = resolveCommand(parts[0].toLowerCase());
    var args = parts.slice(1);
    var output = null;

    if (cmd === 'clear') {
      terminalHistory.innerHTML = '';
    } else if (COMMANDS[cmd]) {
      output = COMMANDS[cmd](args);
    } else {
      output = '<span class="t-red">bash: ' + escapeHtml(parts[0]) +
        ': command not found</span>. Type <span class="t-green">help</span> for available commands.';
    }

    if (output) {
      var el = out(output);
      if (cmd === 'arch') el.classList.add('term-diagram');
      terminalHistory.appendChild(el);
    }

    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  termForm.addEventListener('submit', function (e) {
    e.preventDefault();
    executeCommand(terminalInput.value);
    terminalInput.value = '';
    terminalInput.focus();
  });

  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.addEventListener('click', function () {
      executeCommand(chip.getAttribute('data-cmd') || '');
      terminalInput.focus();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-action="clear"]'), function (btn) {
    btn.addEventListener('click', function () {
      COMMANDS.clear();
      terminalInput.value = '';
      terminalInput.focus();
    });
  });

  terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      var current = terminalInput.value.trim().toLowerCase();
      if (!current) return;
      var names = Object.keys(COMMANDS).concat(['topology', 'labs', 'casestudy']);
      var match = names.filter(function (n) { return n.indexOf(current) === 0; })[0];
      if (match) terminalInput.value = match;
    }
  });

  terminalCard.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    terminalInput.focus();
  });
})();
