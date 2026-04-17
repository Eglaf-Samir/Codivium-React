(() => {
  'use strict';

  const SETTINGS_KEY = 'cv.mcq.settings';
  const CORRECT_KEY  = 'cv.mcq.correctIds';

  /* ── Helpers ────────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function readSettings() {
    try { const r = localStorage.getItem(SETTINGS_KEY); return r ? JSON.parse(r) : null; }
    catch(_) { return null; }
  }
  function readSet(key) {
    try { const r = localStorage.getItem(key); const a = r ? JSON.parse(r) : []; return new Set(Array.isArray(a) ? a : []); }
    catch(_) { return new Set(); }
  }
  function writeSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch(_) {}
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── Code-aware renderer ─────────────────────────────────────── */
  function renderContent(text, container) {
    container.innerHTML = '';
    if (!text) return;
    const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
    let last = 0, m;
    while ((m = fenceRe.exec(text)) !== null) {
      if (m.index > last) appendInlineText(text.slice(last, m.index), container);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      if (m[1]) code.className = 'language-' + m[1];
      code.textContent = m[2].trimEnd();
      pre.appendChild(code);
      pre.className = 'quiz-code-block';
      container.appendChild(pre);
      last = fenceRe.lastIndex;
    }
    if (last < text.length) appendInlineText(text.slice(last), container);
  }

  function appendInlineText(text, container) {
    if (!text) return;
    const re = /`([^`]+)`/g;
    let last = 0, m;
    const frag = document.createDocumentFragment();
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) appendTextLines(text.slice(last, m.index), frag);
      const code = document.createElement('code');
      code.className = 'quiz-inline-code';
      code.textContent = m[1];
      frag.appendChild(code);
      last = re.lastIndex;
    }
    if (last < text.length) appendTextLines(text.slice(last), frag);
    container.appendChild(frag);
  }

  function appendTextLines(text, frag) {
    text.split('\n').forEach((p, i, arr) => {
      frag.appendChild(document.createTextNode(p));
      if (i < arr.length - 1) frag.appendChild(document.createElement('br'));
    });
  }

  /* ── Demo question bank ──────────────────────────────────────── */
  /* Schema:
   *   id, category, difficulty, question, options[], correctIndices[],
   *   explanation, nanoTutorial (string | null)
   */
  /* ── Demo question bank (fallback when API unavailable) ──────────────────
   * Used when GET /api/mcq/questions returns an error or is not yet implemented.
   * Replace by wiring FE-05: fetchQuestions() replaces getDemoBank().
   * ─────────────────────────────────────────────────────────────────────── */
  function getDemoBank() {
    /* Allow demo pages to inject a custom question bank via window global */
    if (Array.isArray(window.__CODIVIUM_DEMO_MCQ_BANK__) &&
        window.__CODIVIUM_DEMO_MCQ_BANK__.length > 0) {
      return window.__CODIVIUM_DEMO_MCQ_BANK__;
    }
    /* All questions have exactly 6 options, 2-wide × 3-deep. */
    return [
      {
        id: 'lb_types', category: 'Language Basics', difficulty: 'basic',
        question: 'Which of the following creates a list in Python?',
        options: [
          '`my = (1, 2, 3)`',
          '`my = {1, 2, 3}`',
          '`my = [1, 2, 3]`',
          '`my = <1, 2, 3>`',
          '`my = {1: "a", 2: "b"}`',
          '`my = array(1, 2, 3)`'
        ],
        correctIndices: [2],
        explanation: 'Square brackets `[]` create a list. Parentheses make a tuple, curly braces make a set or dict, and the other forms are not valid Python literal syntax.',
        nanoTutorial: '## Python Collection Literals\n\n```python\n# List — ordered, mutable\nmy_list = [1, 2, 3]\n\n# Tuple — ordered, immutable\nmy_tuple = (1, 2, 3)\n\n# Set — unordered, no duplicates\nmy_set = {1, 2, 3}\n\n# Dict — key-value pairs\nmy_dict = {"a": 1, "b": 2}\n\n# Empty containers\nempty_list  = []\nempty_tuple = ()\nempty_set   = set()   # not {}  (that is an empty dict!)\nempty_dict  = {}\n```'
      },
      {
        id: 'lb_neg_idx', category: 'Language Basics', difficulty: 'basic',
        question: 'What does this print?\n\n```python\nx = [10, 20, 30, 40, 50]\nprint(x[-2])\n```',
        options: ['10', '20', '30', '40', '50', 'IndexError'],
        correctIndices: [3],
        explanation: '`x[-2]` counts two from the end. Index -1 is 50, so -2 is 40.',
        nanoTutorial: '## Negative Indexing\n\nNegative indices count from the **end** of the sequence.\n\n```python\nmy_list = [10, 20, 30, 40, 50]\nmy_list[-1]  # 50\nmy_list[-2]  # 40\nmy_list[-5]  # 10  (same as [0])\n```\n\nWorks for lists, tuples, and strings.'
      },
      {
        id: 'builtins_fns', category: 'Builtins', difficulty: 'basic',
        question: 'Which are Python built-in functions? (Select all that apply.)',
        options: [
          '`len()`',
          '`size()`',
          '`sorted()`',
          '`count()`',
          '`enumerate()`',
          '`flatten()`'
        ],
        correctIndices: [0, 2, 4],
        explanation: '`len()`, `sorted()`, and `enumerate()` are builtins. `size()` is a NumPy attribute, not a builtin. `count()` is a sequence *method*. `flatten()` does not exist as a Python builtin.',
        nanoTutorial: '## Useful Python Builtins\n\n```python\n# len() — number of items\nlen([1, 2, 3])          # 3\nlen("hello")            # 5\n\n# sorted() — returns a new sorted list\nsorted([3, 1, 2])       # [1, 2, 3]\nsorted("cba")           # [\'a\', \'b\', \'c\']\n\n# enumerate() — index + value pairs\nfor i, v in enumerate(["a", "b", "c"]):\n    print(i, v)  # 0 a / 1 b / 2 c\n\n# map() — apply function to each item\nlist(map(str.upper, ["a", "b"]))  # [\'A\', \'B\']\n```'
      },
      {
        id: 'dt_dict_merge', category: 'Data Types & Data Structures', difficulty: 'intermediate',
        question: 'Which produces `{"a": 1, "b": 2, "c": 3}` from:\n\n```python\nd1 = {"a": 1, "b": 2}\nd2 = {"c": 3}\n```',
        options: [
          '`d1 + d2`',
          '`{**d1, **d2}`',
          '`d1.append(d2)`',
          '`dict.merge(d1, d2)`',
          '`d1.concat(d2)`',
          '`[d1, d2]`'
        ],
        correctIndices: [1],
        explanation: 'The `**` unpacking operator merges two dicts into a new dict literal. None of the other forms are valid for merging dicts.',
        nanoTutorial: null
      },
      {
        id: 'funcs_mutable_default', category: 'Functions', difficulty: 'intermediate',
        question: 'What is printed?\n\n```python\ndef add(item, bag=[]):\n    bag.append(item)\n    return bag\n\nprint(add("x"))\nprint(add("y"))\n```',
        options: [
          '`[\'x\']` then `[\'y\']`',
          '`[\'x\']` then `[\'x\', \'y\']`',
          '`[\'x\', \'y\']` both times',
          'TypeError',
          '`None` then `None`',
          'SyntaxError'
        ],
        correctIndices: [1],
        explanation: 'The default list `[]` is created once at definition time and shared across calls. The second call appends to the same list that already has `\'x\'`.',
        nanoTutorial: '## Mutable Default Argument\n\n**The bug:**\n```python\ndef add(item, bag=[]):\n    bag.append(item)\n    return bag\n\nadd("a")  # ["a"]\nadd("b")  # ["a", "b"]  ← not ["b"]!\n```\n\n**The fix:**\n```python\ndef add(item, bag=None):\n    if bag is None:\n        bag = []\n    bag.append(item)\n    return bag\n```'
      },
      {
        id: 'perf_o1', category: 'Performance', difficulty: 'intermediate',
        question: 'Which Python operations are O(1) on average? (Select all that apply.)',
        options: [
          'Appending to a list with `.append()`',
          'Membership test `x in my_list`',
          'Membership test `x in my_set`',
          'Sorting a list with `.sort()`',
          'Dict key lookup `my_dict[key]`',
          'Getting `len()` of a list'
        ],
        correctIndices: [0, 2, 4, 5],
        explanation: 'List `.append()` is amortised O(1). Set and dict lookups are O(1) average. `len()` is O(1) — Python stores the length internally. List `in` is O(n). `.sort()` is O(n log n).',
        nanoTutorial: '## Big-O Quick Reference\n\n| Operation | list | set | dict |\n|-----------|------|-----|------|\n| `x in c` | O(n) | O(1) | O(1) |\n| index / key access | O(1) | — | O(1) |\n| `.append()` / `.add()` | O(1)* | O(1)* | — |\n| `len()` | O(1) | O(1) | O(1) |\n| `.sort()` | O(n log n) | — | — |\n\n*amortised'
      },
      {
        id: 'regex_backref', category: 'Regular Expressions', difficulty: 'advanced',
        question: 'What does this return?\n\n```python\nimport re\nre.findall(r"(\\w+)\\1", "hello aabbcc world")\n```',
        options: [
          '`[]`',
          '`[\'a\', \'b\', \'c\']`',
          '`[\'aa\', \'bb\', \'cc\']`',
          '`[\'aabbcc\']`',
          '`[\'hello\', \'world\']`',
          'TypeError'
        ],
        correctIndices: [1],
        explanation: '`(\\w+)\\1` requires the captured group to repeat immediately. `findall` returns the **group contents**, not the full match — so `"aa"` → `"a"`, etc.',
        nanoTutorial: null
      },
      {
        id: 'oo_inherit', category: 'Object Orientation', difficulty: 'intermediate',
        question: 'Which statements about Python inheritance are correct? (Select all that apply.)',
        options: [
          'A class can inherit from multiple base classes',
          'Double-underscore attributes are accessible in subclasses by their original name',
          '`super()` follows the Method Resolution Order (MRO)',
          '`isinstance(obj, Base)` is True for instances of subclasses of `Base`',
          'Python resolves MRO using depth-first search',
          '`__mro__` is only available on instances, not class objects'
        ],
        correctIndices: [0, 2, 3],
        explanation: 'Multiple inheritance is supported. `super()` follows C3 MRO. `isinstance` is True for subclass instances. Double-underscore names are mangled, so NOT accessible by original name in subclasses. Python uses C3 linearisation, not depth-first. `__mro__` is a class attribute.',
        nanoTutorial: '## Python Inheritance\n\n```python\nclass A:\n    def hello(self): print("A")\n\nclass B(A):\n    def hello(self):\n        super().hello()  # follows MRO\n        print("B")\n\nclass D(B, A): pass\nprint(D.__mro__)  # D, B, A, object\n```\n\n**Name mangling:**\n```python\nclass Foo:\n    def __init__(self):\n        self.__x = 42  # stored as _Foo__x\n\nclass Bar(Foo):\n    def get(self):\n        return self._Foo__x  # must use mangled name\n```'
      },
      {
        id: 'builtins_map', category: 'Builtins', difficulty: 'basic',
        question: 'Which is equivalent to `[x * 2 for x in range(5)]`?',
        options: [
          '`list(map(lambda x: x * 2, range(5)))`',
          '`list(filter(lambda x: x * 2, range(5)))`',
          '`list(reduce(lambda x, y: x * 2, range(5)))`',
          '`list(zip(range(5), range(5)))`',
          '`list(sorted(x * 2 for x in range(5)))`',
          '`list(reversed([x * 2 for x in range(5)]))`'
        ],
        correctIndices: [0],
        explanation: '`map()` applies a function to every element. Wrapping in `list()` gives the same result as the comprehension. `filter()` keeps truthy items, not transforms. The others produce different results.',
        nanoTutorial: null
      },
      {
        id: 'perf_tuple', category: 'Performance', difficulty: 'basic',
        question: 'Which are advantages of tuples over lists for fixed data? (Select all that apply.)',
        options: [
          'Tuples can be used as dictionary keys',
          'Tuples are hashable',
          'Tuples support `.append()` for adding items',
          'Tuples use slightly less memory than equivalent lists',
          'Tuples are faster to create than lists of the same size',
          'Tuples have an `.index()` method'
        ],
        correctIndices: [0, 1, 3, 4, 5],
        explanation: 'Tuples are hashable → can be dict keys. They use less memory, are faster to create, and have `.index()`. `.append()` is a list-only method — tuples are immutable.',
        nanoTutorial: '## Tuple vs List\n\n```python\nimport sys\n\nprint(sys.getsizeof([1,2,3,4,5]))  # ~120 bytes\nprint(sys.getsizeof((1,2,3,4,5))) # ~80 bytes\n\n# Dict key\nd = {}\nd[(1, 2)] = "ok"    # ✓\n# d[[1, 2]] = "err"  # ✗ TypeError\n\nt = (10, 20, 30)\nt.index(20)   # 1\nlen(t)        # 3\n```'
      },
      {
        id: 'lb_walrus', category: 'Language Basics', difficulty: 'advanced',
        question: 'What does the `:=` (walrus) operator allow in Python 3.8+?',
        options: [
          'Assign a value inside an expression',
          'Compare two values without side effects',
          'Create a shallow copy of a dictionary',
          'Declare a typed constant',
          'Perform integer floor division',
          'Unpack a sequence in one step'
        ],
        correctIndices: [0],
        explanation: 'The walrus operator `:=` assigns a value **inside an expression** — useful in `while` conditions, comprehension filters, and `if` checks to avoid computing a value twice.',
        nanoTutorial: null
      },
      {
        id: 're_flags', category: 'Regular Expressions', difficulty: 'intermediate',
        question: 'Which `re` flags make `.` match newline characters? (Select all that apply.)',
        options: [
          '`re.DOTALL`',
          '`re.S`',
          '`re.MULTILINE`',
          '`re.I`',
          '`re.X`',
          '`re.M`'
        ],
        correctIndices: [0, 1],
        explanation: '`re.DOTALL` and `re.S` are the same flag — both make `.` match any character including `\\n`. `re.MULTILINE`/`re.M` changes `^`/`$` to match at line boundaries. `re.I` is case-insensitive. `re.X` allows verbose patterns.',
        nanoTutorial: '## `re` Module Flags\n\n```python\nimport re\n\n# DOTALL: . matches \\n\nre.search(r"start.*end", "start\\nend", re.DOTALL)  # match\n\n# MULTILINE: ^ / $ at every line\nre.findall(r"^\\w+", "foo\\nbar", re.MULTILINE)  # [\'foo\', \'bar\']\n\n# IGNORECASE\nre.search(r"python", "PYTHON", re.I)  # match\n\n# Combine with |\nre.search(r"a.*b", text, re.DOTALL | re.I)\n```'
      }
    ];
  }

  function humanDiff(d) {
    return d === 'basic' ? 'Basic' : d === 'intermediate' ? 'Intermediate' : 'Advanced';
  }

  /* ── Segmented progress bar ──────────────────────────────────── */
  function buildProgressSegs(total) {
    const track = el('progressTrack');
    if (!track) return;
    track.innerHTML = '';
    track.setAttribute('aria-valuemax', String(total));
    for (let i = 0; i < total; i++) {
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.dataset.idx = i;
      track.appendChild(seg);
    }
  }

  function updateProgressSeg(index, result) {
    const track = el('progressTrack');
    if (!track) return;
    const seg = track.querySelector(`.seg[data-idx="${index}"]`);
    if (seg) {
      seg.className = 'seg ' + (result === 'correct' ? 'answered-correct' : result === 'peeked' ? 'answered-peeked' : 'answered-wrong');
    }
  }

  function updateProgressLabel(answered, total) {
    const lab = el('progressLabel');
    if (lab) lab.textContent = `${answered} answered · ${total - answered} remaining`;
    const track = el('progressTrack');
    if (track) {
      track.setAttribute('aria-valuenow', String(answered));
    }
  }

  /* ── Render one question ─────────────────────────────────────── */
  function renderQuestion(state) {
    const q = state.questions[state.index];
    if (!q) return;

    el('qNumber').textContent = `${state.index + 1} / ${state.questions.length}`;
    el('tagCategory').textContent = q.category;
    el('tagDifficulty').textContent = humanDiff(q.difficulty);

    // Multi-answer tag
    const multiTag = el('tagMulti');
    if (multiTag) multiTag.hidden = !(q.correctIndices.length > 1);

    // Progress label
    updateProgressLabel(state.index, state.questions.length);

    // Question content
    renderContent(q.question, el('qText'));

    // Answer options as checkboxes (multi-select capable)
    const wrap = el('options');
    wrap.innerHTML = '';
    q.options.forEach((opt, i) => {
      const lab = document.createElement('label');
      lab.className = 'opt';
      lab.setAttribute('for', `opt_${i}`);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'answer';
      input.id = `opt_${i}`;
      input.value = String(i);

      const span = document.createElement('span');
      renderContent(opt, span);

      lab.appendChild(input);
      lab.appendChild(span);
      wrap.appendChild(lab);
    });

    // Reset view-answer UI
    el('peekWarning').hidden = true;

    // Tutorial button
    const tutBtn = el('btnTutorial');
    if (tutBtn) tutBtn.hidden = !q.nanoTutorial;

    // Hide tutorial panel when switching questions
    const panel = el('tutorialPanel');
    if (panel) { panel.hidden = true; panel.style.display = 'none'; }

    // Buttons
    const peekBtn = el('btnPeek');
    if (peekBtn) { peekBtn.disabled = false; peekBtn.hidden = false; }
    el('btnSubmit').disabled = true;  // re-enabled when user selects an option
    const nextPeek = el('btnNextPeek');
    if (nextPeek) nextPeek.disabled = true;

    state.locked = false;
    state.tutorialViewedThisQuestion = false;
    state._questionRenderedAt = Date.now(); // FE-08: for responseTimeSeconds

    // Enable Submit only when at least one option is checked
    function updateSubmitState() {
      const checked = document.querySelectorAll('input[name="answer"]:checked').length;
      el('btnSubmit').disabled = (checked === 0);
    }
    const optWrap = el('options');
    if (optWrap) {
      optWrap.addEventListener('change', updateSubmitState, { once: false });
    }
  }

  /* ── Get selected indices ────────────────────────────────────── */
  function getSelected() {
    return Array.from(document.querySelectorAll('input[name="answer"]:checked'))
      .map(cb => Number(cb.value));
  }

  /* ── Submit / grade ──────────────────────────────────────────── */
  function gradeCurrent(state, isPeek) {
    if (state.locked) return;
    const q = state.questions[state.index];
    const selected = getSelected();

    if (!isPeek && selected.length === 0) {
      // Brief nudge — don't lock, just warn
      el('btnSubmit').textContent = 'Pick an answer';
      setTimeout(() => {
        if (!state.locked) el('btnSubmit').textContent = 'Submit';
      }, 1500);
      return;
    }

    state.locked = true;

    const correctSet  = new Set(q.correctIndices);
    const selectedSet = new Set(selected);
    const isCorrect   = !isPeek &&
      selected.length === q.correctIndices.length &&
      selected.every(i => correctSet.has(i));

    // Lock options; only reveal correct answers on peek, not on submit
    Array.from(document.querySelectorAll('.opt')).forEach((row, i) => {
      row.classList.add('locked');
      const input = row.querySelector('input');
      if (input) input.disabled = true;
      if (selectedSet.has(i)) row.classList.add('user-selected');
      if (isPeek) {
        if (correctSet.has(i))  row.classList.add('correct');
        if (!correctSet.has(i) && selectedSet.has(i)) row.classList.add('wrong');
      }
    });

    // Record result
    const resultType = isPeek ? 'peeked' : isCorrect ? 'correct' : 'wrong';
    const _responseMs = state._questionRenderedAt
      ? Math.max(0, Date.now() - state._questionRenderedAt)
      : null;
    state.answers.push({
      q, selected: [...selected], isPeek, isCorrect,
      tutorialViewed: state.tutorialViewedThisQuestion,
      submittedAt: new Date().toISOString(),
      responseTimeSeconds: _responseMs !== null ? Math.round(_responseMs / 1000) : null
    });
    if (!isPeek && isCorrect) {
      state.correctCount++;
      q.correctIndices.forEach(i => state.correctSet.add(q.id + '_' + i));
      // Update client-side cache (authoritative source is the backend once BE-03 is live)
      writeSet(CORRECT_KEY, state.correctSet);
    }
    if (isPeek) state.peekCount++;

    updateProgressSeg(state.index, resultType);
    updateProgressLabel(state.index + 1, state.questions.length);

    // Hide peek warning
    el('peekWarning').hidden = true;

    // Disable + hide view-answer button
    const peekBtn = el('btnPeek');
    if (peekBtn) { peekBtn.disabled = true; peekBtn.hidden = true; }

    // Advance buttons
    el('btnSubmit').disabled = true;

    if (isPeek) {
      // Peek: reveal correct answers, enable Next button — do not auto-advance
      const nextBtn = el('btnNextPeek');
      if (nextBtn) nextBtn.disabled = false;
    } else {
      // Normal submit: show correct/wrong borders for 1200ms, then advance.
      // Explanation is intentionally withheld — shown only in the summary.
      // Mark correct options green, user's wrong selections red.
      Array.from(document.querySelectorAll('.opt')).forEach((row, i) => {
        if (correctSet.has(i))                             row.classList.add('correct');
        if (!correctSet.has(i) && selectedSet.has(i))     row.classList.add('wrong');
      });

      setTimeout(() => {
        if (state.index < state.questions.length - 1) {
          state.index++;
          renderQuestion(state);
        } else {
          showSummary(state);
        }
      }, window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 600 : 2400);
    }
  }

  /* ── Results submission: POST /api/mcq/results ────────────────────────────
   * Sends the full session result to the backend for persistence and scoring.
   * Fire-and-forget: summary renders regardless of POST outcome.
   * See contracts/mcq-quiz-api.contract.md §3 for the full payload schema.
   * ─────────────────────────────────────────────────────────────────────── */
  /* Read the last adaptive recommendation choice, if this quiz was launched
   * from adaptive-practice.html via ?source=adaptive.
   * Stored by recordRecommendationChoice() in adaptive-practice.js.
   * Returns the recommendation type label, or null if not applicable.
   */
  function getAdaptiveSource() {
    try {
      const raw = localStorage.getItem('cv_adaptive_last_choice');
      if (!raw) return null;
      const rec = JSON.parse(raw);
      // Only attach if the choice was made recently (within 5 minutes)
      const age = Date.now() - new Date(rec.chosenAt).getTime();
      return age < 300000 ? (rec.type || null) : null;
    } catch(_) { return null; }
  }

  async function submitResults(state, quizStartedAt) {
    const completedAt  = new Date().toISOString();
    const totalQ       = state.questions.length;
    const minutesSpent = Math.round(
      (Date.now() - new Date(quizStartedAt).getTime()) / 60000 * 10
    ) / 10;

    const payload = {
      sessionId:      state.sessionId,   // null when using demo bank (API not live)
      settings: {
        categories:    state.settings.categories || [],
        difficulty:    state.settings.difficulty || 'basic',
        questionCount: state.settings.questionCount || totalQ,
        skipCorrect:   !!state.settings.skipCorrect
      },
      startedAt:      quizStartedAt,
      completedAt,
      minutesSpent,
      totalQuestions: totalQ,
      correct:        state.correctCount,
      peeked:         state.peekCount,
      scorePercent:   totalQ > 0 ? Math.round(state.correctCount / totalQ * 1000) / 10 : 0,
      selectedRecommendationType: getAdaptiveSource(), // null unless launched from adaptive page
      answers: state.answers.map((ans, idx) => ({
        questionId:          ans.q.id,
        category:            ans.q.category,
        difficulty:          ans.q.difficulty,
        selectedIndices:     ans.selected,
        correctIndices:      ans.q.correctIndices,
        isCorrect:           ans.isCorrect,
        isPeek:              ans.isPeek,
        tutorialViewed:      ans.tutorialViewed,
        submittedAt:         ans.submittedAt,
        responseTimeSeconds: ans.responseTimeSeconds,
        questionIndex:       idx
      }))
    };

    // Skip if no sessionId (API not live — demo bank in use)
    if (!state.sessionId) {
      console.info('[MCQ] No sessionId — results not posted (demo bank mode)');
      return;
    }

    try {
      const res = await __cvFetch('/api/mcq/results', {
        method:  'POST',
        headers: Object.assign(
          getAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
          window.__CODIVIUM_CSRF_TOKEN ? { 'X-Csrf-Token': window.__CODIVIUM_CSRF_TOKEN } : {}
        ),
        body:    JSON.stringify(payload)
      }, 8000);
      if (!res.ok) console.warn('[MCQ] Results POST failed:', res.status);
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'timeout' : err.message;
      console.warn('[MCQ] Results POST error (results not recorded):', msg);
    }
  }

  /* ── Summary with full review ────────────────────────────────── */
  function showSummary(state) {
    // Fire-and-forget results POST — does not block summary render
    submitResults(state, state._quizStartedAt || new Date().toISOString());

    el('quizStage').style.display = 'none';

    const total = state.questions.length;
    el('mTotal').textContent   = String(total);
    el('mCorrect').textContent = String(state.correctCount);
    el('mWrong').textContent   = String(total - state.correctCount - state.peekCount);
    if (el('mPeeked')) el('mPeeked').textContent = String(state.peekCount);

    // Build per-question review
    const reviewList = el('reviewList');
    reviewList.innerHTML = '';

    state.answers.forEach((ans, idx) => {
      const { q, selected, isPeek, isCorrect } = ans;
      const correctSet = new Set(q.correctIndices);
      const selectedSet = new Set(selected);

      const item = document.createElement('div');
      item.className = 'review-item';

      // Head
      const head = document.createElement('div');
      head.className = 'review-item-head';
      const num = document.createElement('div');
      num.className = 'review-num';
      num.textContent = `Q${idx + 1}`;
      const badge = document.createElement('div');
      badge.className = 'review-status-badge ' + (isPeek ? 'peeked' : isCorrect ? 'correct' : 'wrong');
      badge.textContent = isPeek ? 'Revealed' : isCorrect ? 'Correct' : 'Incorrect';
      head.appendChild(num);
      head.appendChild(badge);
      item.appendChild(head);

      // Body
      const body = document.createElement('div');
      body.className = 'review-item-body';

      const qDiv = document.createElement('div');
      qDiv.className = 'review-q';
      renderContent(q.question, qDiv);
      body.appendChild(qDiv);

      // Options
      const optsDiv = document.createElement('div');
      optsDiv.className = 'review-options';
      q.options.forEach((opt, i) => {
        const row = document.createElement('div');
        row.className = 'review-opt';
        const isCorrectOpt = correctSet.has(i);
        const wasSelected  = selectedSet.has(i);

        if (isCorrectOpt)       row.classList.add('correct');
        else if (wasSelected)   row.classList.add('wrong');

        const icon = document.createElement('span');
        icon.className = 'review-opt-icon';
        icon.textContent = isCorrectOpt ? '✓' : wasSelected ? '✗' : '·';
        row.appendChild(icon);

        const txt = document.createElement('span');
        renderContent(opt, txt);
        row.appendChild(txt);
        optsDiv.appendChild(row);
      });
      body.appendChild(optsDiv);

      // Explanation
      if (q.explanation) {
        const exp = document.createElement('div');
        exp.className = 'review-explanation';
        const lbl = document.createElement('div');
        lbl.className = 'review-explanation-label';
        lbl.textContent = 'Explanation';
        exp.appendChild(lbl);
        const txt = document.createElement('div');
        renderContent(q.explanation, txt);
        exp.appendChild(txt);
        body.appendChild(exp);
      }

      item.appendChild(body);
      reviewList.appendChild(item);
    });

    const summaryEl = el('summary');
    summaryEl.classList.add('show');
    summaryEl.hidden = false;
    el('btnRestart').focus();
  }

  /* ── Tutorial panel toggle ───────────────────────────────────── */
  function toggleTutorial(state) {
    const panel = el('tutorialPanel');
    const q = state.questions[state.index];
    if (!q || !q.nanoTutorial) { if (panel) panel.hidden = true; return; }
    if (!panel.hidden) { panel.hidden = true; panel.style.display = 'none'; return; }
    renderContent(q.nanoTutorial, el('nanoTutorialBody'));
    panel.hidden = false;
    panel.style.display = '';  // let CSS flex display take effect
    state.tutorialViewedThisQuestion = true;  // record for analytics
  }

  /* ── Pick questions ──────────────────────────────────────────── */
  /* ── Question fetcher: GET /api/mcq/questions ─────────────────────────────
   * Returns { sessionId, questions[] } from the backend.
   * On failure falls back to getDemoBank() with client-side filtering.
   * ─────────────────────────────────────────────────────────────────────── */
  async function fetchQuestions(settings, correctSet) {
    const params = new URLSearchParams({
      categories:   (settings.categories || []).join(','),
      difficulty:   settings.difficulty || 'basic',
      count:        String(settings.questionCount || 10),
      skipCorrect:  settings.skipCorrect ? 'true' : 'false'
    });

    // Skip network call immediately if we know the API isn't available:
    // — offline, or no real auth token (demo/local mode).
    const hasRealToken = !!(
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cv_auth_token')) ||
      (typeof localStorage   !== 'undefined' && localStorage.getItem('cv_auth_token'))
    );
    if (!hasRealToken || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return { sessionId: null, questions: pickFromDemo(settings, correctSet) };
    }

    try {
      const res = await __cvFetchWithRetry(
        '/api/mcq/questions?' + params.toString(),
        { headers: getAuthHeaders({ 'Accept': 'application/json' }) },
        5000,
        1
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Empty question set from API');
      }
      return { sessionId: data.sessionId || null, questions: data.questions };
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'timeout' : err.message;
      console.warn('[MCQ] API unavailable — using demo bank:', msg);
      return { sessionId: null, questions: pickFromDemo(settings, correctSet) };
    }
  }

  /* Fallback: filter the demo bank client-side when API is unavailable */
  function pickFromDemo(settings, correctSet) {
    const bank   = getDemoBank();
    const catSet = new Set((settings.categories || []).map(String));
    const diff   = String(settings.difficulty || 'basic');

    let filtered = bank.filter(q => catSet.has(q.category) && q.difficulty === diff);
    if (!filtered.length) filtered = bank.filter(q => catSet.has(q.category));
    if (!filtered.length) filtered = bank.slice();

    const desired = Math.max(1, Math.min(50, Number(settings.questionCount) || 10));
    return shuffle(filtered).slice(0, Math.min(desired, filtered.length));
  }

  /* ── Timer ───────────────────────────────────────────────────── */
  function initTimer() {
    const digitalEl  = el('cvTimerDigital');
    const secHand    = el('cvTimerSecHand');
    const minHand    = el('cvTimerMinHand');
    const hourHand   = el('cvTimerHourHand');
    const hourTipEl  = el('cvTimerHourTip');
    const minTipEl   = el('cvTimerMinTip');
    const toggleBtn  = el('cvTimerToggle');
    const toggleIcon = el('cvTimerToggleIcon');
    const ticksG     = el('cvTimerTicks');

    const EYE_PATH = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8";
    const EYE_OFF  = "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";

    // Build tick marks
    if (ticksG) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 2 * Math.PI;
        const outer = 29, inner = i % 3 === 0 ? 24 : 27;
        const x1 = (32 + Math.sin(a) * outer).toFixed(2);
        const y1 = (32 - Math.cos(a) * outer).toFixed(2);
        const x2 = (32 + Math.sin(a) * inner).toFixed(2);
        const y2 = (32 - Math.cos(a) * inner).toFixed(2);
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', i % 3 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)');
        ln.setAttribute('stroke-width', i % 3 === 0 ? '1.5' : '1');
        ln.setAttribute('stroke-linecap', 'round');
        ticksG.appendChild(ln);
      }
    }

    function hand(handEl, deg, cx, cy, len, tipEl) {
      if (!handEl) return;
      const r = (deg - 90) * Math.PI / 180;
      handEl.setAttribute('x2', (cx + Math.cos(r) * len).toFixed(2));
      handEl.setAttribute('y2', (cy + Math.sin(r) * len).toFixed(2));
      if (tipEl) tipEl.setAttribute('transform', `rotate(${deg} ${cx} ${cy})`);
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    const startTime = Date.now();

    function update() {
      const elapsedMs = Math.max(0, Date.now() - startTime);
      const elapsedS  = elapsedMs / 1000;
      const secsF     = elapsedS % 60;
      const secs      = Math.floor(secsF);
      const mins      = Math.floor(elapsedS / 60) % 60;
      const hours     = Math.floor(elapsedS / 3600);
      if (digitalEl) digitalEl.textContent = (hours > 0 ? hours + ':' : '') + pad(mins) + ':' + pad(secs);
      hand(secHand,  (secsF / 60) * 360,                              32, 32, 24);
      hand(minHand,  (elapsedS % 3600) / 3600 * 360,                  32, 32, 21, minTipEl);
      hand(hourHand, (elapsedS % (12 * 3600)) / (12 * 3600) * 360,    32, 32, 14, hourTipEl);
    }

    function updateToggleIcon(hidden) {
      if (!toggleIcon) return;
      toggleIcon.innerHTML = '';
      const ns = 'http://www.w3.org/2000/svg';
      if (hidden) {
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', EYE_OFF); p.setAttribute('stroke', 'currentColor');
        p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('fill', 'none');
        toggleIcon.appendChild(p);
      } else {
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', EYE_PATH); p.setAttribute('stroke', 'currentColor');
        p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('fill', 'none');
        toggleIcon.appendChild(p);
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx','12'); c.setAttribute('cy','12'); c.setAttribute('r','3');
        c.setAttribute('stroke','currentColor'); c.setAttribute('stroke-width','2'); c.setAttribute('fill','none');
        toggleIcon.appendChild(c);
      }
    }

    let hidden = false;
    try { hidden = localStorage.getItem('cv_timer_hidden') === '1'; } catch(_) {}
    if (hidden) document.body.classList.add('timer-hidden');
    updateToggleIcon(hidden);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        hidden = !hidden;
        document.body.classList.toggle('timer-hidden', hidden);
        try { localStorage.setItem('cv_timer_hidden', hidden ? '1' : '0'); } catch(_) {}
        updateToggleIcon(hidden);
      });
    }

    update();
    const __quizTimerId = setInterval(update, 250);
    // Clear timer if user navigates away to prevent it running after page exit
    window.addEventListener('pagehide', function() {
      clearInterval(__quizTimerId);
    }, { once: true });
  }

  /* ── Boot ─────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    const settings = readSettings();
    if (!settings) { window.location.href = 'mcq-parent.html'; return; }

    const correctSet    = readSet(CORRECT_KEY);
    const quizStartedAt = new Date().toISOString();

    // Show loading state while fetching questions from API
    const qTextEl = el('qText');
    if (qTextEl) qTextEl.textContent = 'Loading questions…';
    const submitBtn = el('btnSubmit');
    if (submitBtn) submitBtn.disabled = true;
    const quizCard = el('quizCard');
    if (quizCard) quizCard.setAttribute('aria-busy', 'true');

    const { sessionId, questions } = await fetchQuestions(settings, correctSet);

    if (quizCard) quizCard.removeAttribute('aria-busy');

    if (!questions || questions.length === 0) {
      if (qTextEl) qTextEl.textContent = 'No questions available for these filters. Please go back and adjust your settings.';
      const back = el('btnBack');
      if (back) back.style.display = '';
      return;
    }

    const meta = el('appliedMeta');
    if (meta) {
      const cats = Array.isArray(settings.categories) ? settings.categories.length : 0;
      meta.textContent = `${cats} categor${cats === 1 ? 'y' : 'ies'} · ${humanDiff(settings.difficulty)} · ${questions.length} question${questions.length === 1 ? '' : 's'}${settings.skipCorrect ? ' · skipping correct' : ''}`;
    }

    const state = {
      questions, index: 0,
      correctCount: 0, peekCount: 0,
      answers: [], locked: false,
      correctSet,
      sessionId,             // from fetchQuestions() — null when using demo bank
      settings,              // stored for results POST payload
      tutorialViewedThisQuestion: false,
      _quizStartedAt: quizStartedAt  // for submitResults()
    };

    buildProgressSegs(questions.length);
    updateProgressLabel(0, questions.length);

    // Wire buttons
    el('btnBack').addEventListener('click', () => { window.location.href = 'mcq-parent.html'; });
    el('btnAdjust').addEventListener('click', () => { window.location.href = 'mcq-parent.html'; });
    el('btnSubmit').addEventListener('click', () => gradeCurrent(state, false));
    el('btnPeek').addEventListener('click',   () => { el('peekWarning').hidden = false; });
    const peekNext = el('btnNextPeek');
    if (peekNext) peekNext.addEventListener('click', () => {
      peekNext.disabled = true;  // re-disabled after use; renderQuestion will also reset it
      if (state.index < state.questions.length - 1) { state.index++; renderQuestion(state); }
      else showSummary(state);
    });
    el('btnPeekCancel').addEventListener('click', () => { el('peekWarning').hidden = true; });
    el('btnPeekConfirm').addEventListener('click', () => gradeCurrent(state, true));
    el('btnTutorial').addEventListener('click', () => toggleTutorial(state));
    // Tutorial panel has no close button — toggle via Tutorial button again

    el('btnRestart').addEventListener('click', () => {
      state.correctCount = 0; state.peekCount = 0; state.answers = []; state.index = 0;
      fetchQuestions(settings, state.correctSet).then(({ sessionId, questions }) => {
        state.sessionId = sessionId;
        state.questions = questions;
        el('summary').classList.remove('show');
        el('summary').hidden = true;
        el('quizStage').style.display = '';
        buildProgressSegs(state.questions.length);
        updateProgressLabel(0, state.questions.length);
        renderQuestion(state);
      });

    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (state.locked && key >= '1' && key <= '9') return;
      if (key >= '1' && key <= '9') {
        const opt = el(`opt_${Number(key) - 1}`);
        if (opt && !opt.disabled) { opt.checked = !opt.checked; e.preventDefault(); }
      }
      if (key === 'Enter') {
        const submit = el('btnSubmit');
        if (submit && !submit.disabled) { submit.click(); e.preventDefault(); }
      }
    });

    // Glow-follow cursor effect on quiz windows
    document.querySelectorAll('.glow-follow').forEach((win) => {
      win.addEventListener('pointermove', (e) => {
        const r = win.getBoundingClientRect();
        win.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(2) + '%');
        win.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(2) + '%');
      }, { passive: true });
      win.addEventListener('pointerleave', () => {
        win.style.removeProperty('--mx');
        win.style.removeProperty('--my');
      });
    });

    initTimer();
    renderQuestion(state);
  });
})();
