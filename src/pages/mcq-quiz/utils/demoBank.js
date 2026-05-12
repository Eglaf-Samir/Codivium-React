// utils/demoBank.js — fallback question bank when API is unavailable.
// Copied directly from mcq-quiz.js getDemoBank().

export const DEMO_CATEGORIES = [
  'Language Basics', 'Data Types & Data Structures', 'Functions',
  'Object Orientation', 'Regular Expressions', 'Builtins',
  'Performance', 'Sorting', 'Algorithms', 'Trees',
];

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDemoBank() {
  if (Array.isArray(window.__CODIVIUM_DEMO_MCQ_BANK__) &&
      window.__CODIVIUM_DEMO_MCQ_BANK__.length > 0) {
    return window.__CODIVIUM_DEMO_MCQ_BANK__;
  }
  return [
    {
      id: 'lb_types', category: 'Language Basics', difficulty: 'basic',
      question: 'Which of the following creates a list in Python?',
      options: ['`my = (1, 2, 3)`','`my = {1, 2, 3}`','`my = [1, 2, 3]`','`my = <1, 2, 3>`','`my = {1: "a", 2: "b"}`','`my = array(1, 2, 3)`'],
      correctIndices: [2],
      explanation: 'Square brackets `[]` create a list. Parentheses make a tuple, curly braces make a set or dict.',
      nanoTutorial: '## Python Collection Literals\n\n```python\nmy_list  = [1, 2, 3]   # list\nmy_tuple = (1, 2, 3)   # tuple\nmy_set   = {1, 2, 3}   # set\nmy_dict  = {"a": 1}    # dict\n```',
    },
    {
      id: 'lb_neg_idx', category: 'Language Basics', difficulty: 'basic',
      question: 'What does this print?\n\n```python\nx = [10, 20, 30, 40, 50]\nprint(x[-2])\n```',
      options: ['10','20','30','40','50','IndexError'],
      correctIndices: [3],
      explanation: '`x[-2]` counts two from the end. Index -1 is 50, so -2 is 40.',
      nanoTutorial: '## Negative Indexing\n\n```python\nmy_list = [10, 20, 30, 40, 50]\nmy_list[-1]  # 50\nmy_list[-2]  # 40\n```',
    },
    {
      id: 'builtins_fns', category: 'Builtins', difficulty: 'basic',
      question: 'Which are Python built-in functions? (Select all that apply.)',
      options: ['`len()`','`size()`','`sorted()`','`count()`','`enumerate()`','`flatten()`'],
      correctIndices: [0, 2, 4],
      explanation: '`len()`, `sorted()`, and `enumerate()` are builtins. `size()` is NumPy, `count()` is a method, `flatten()` is not a builtin.',
      nanoTutorial: '## Useful Python Builtins\n\n```python\nlen([1, 2, 3])               # 3\nsorted([3, 1, 2])            # [1, 2, 3]\nfor i, v in enumerate(["a", "b"]):\n    print(i, v)\n```',
    },
    {
      id: 'dt_dict_merge', category: 'Data Types & Data Structures', difficulty: 'intermediate',
      question: 'Which produces `{"a": 1, "b": 2, "c": 3}` from:\n\n```python\nd1 = {"a": 1, "b": 2}\nd2 = {"c": 3}\n```',
      options: ['`d1 + d2`','`{**d1, **d2}`','`d1.append(d2)`','`dict.merge(d1, d2)`','`d1.concat(d2)`','`[d1, d2]`'],
      correctIndices: [1],
      explanation: 'The `**` unpacking operator merges two dicts into a new dict literal.',
      nanoTutorial: null,
    },
    {
      id: 'funcs_mutable_default', category: 'Functions', difficulty: 'intermediate',
      question: 'What is printed?\n\n```python\ndef add(item, bag=[]):\n    bag.append(item)\n    return bag\n\nprint(add("x"))\nprint(add("y"))\n```',
      options: ['`[\'x\']` then `[\'y\']`','`[\'x\']` then `[\'x\', \'y\']`','`[\'x\', \'y\']` both times','TypeError','`None` then `None`','SyntaxError'],
      correctIndices: [1],
      explanation: 'The default list `[]` is created once at definition time and shared across calls.',
      nanoTutorial: '## Mutable Default Argument\n\n```python\n# Bug:\ndef add(item, bag=[]):\n    bag.append(item)\n    return bag\n\n# Fix:\ndef add(item, bag=None):\n    if bag is None:\n        bag = []\n    bag.append(item)\n    return bag\n```',
    },
    {
      id: 'perf_o1', category: 'Performance', difficulty: 'intermediate',
      question: 'Which Python operations are O(1) on average? (Select all that apply.)',
      options: ['Appending to a list with `.append()`','Membership test `x in my_list`','Membership test `x in my_set`','Sorting a list with `.sort()`','Dict key lookup `my_dict[key]`','Getting `len()` of a list'],
      correctIndices: [0, 2, 4, 5],
      explanation: 'List `.append()` is amortised O(1). Set and dict lookups are O(1) average. `len()` is O(1). List `in` is O(n). `.sort()` is O(n log n).',
      nanoTutorial: null,
    },
    {
      id: 'oo_inherit', category: 'Object Orientation', difficulty: 'intermediate',
      question: 'Which statements about Python inheritance are correct? (Select all that apply.)',
      options: ['A class can inherit from multiple base classes','Double-underscore attributes are accessible in subclasses by their original name','`super()` follows the Method Resolution Order (MRO)','`isinstance(obj, Base)` is True for instances of subclasses of `Base`','Python resolves MRO using depth-first search','`__mro__` is only available on instances, not class objects'],
      correctIndices: [0, 2, 3],
      explanation: 'Multiple inheritance is supported. `super()` follows C3 MRO. `isinstance` is True for subclass instances.',
      nanoTutorial: null,
    },
    {
      id: 'lb_walrus', category: 'Language Basics', difficulty: 'advanced',
      question: 'What does the `:=` (walrus) operator allow in Python 3.8+?',
      options: ['Assign a value inside an expression','Compare two values without side effects','Create a shallow copy of a dictionary','Declare a typed constant','Perform integer floor division','Unpack a sequence in one step'],
      correctIndices: [0],
      explanation: 'The walrus operator `:=` assigns a value inside an expression.',
      nanoTutorial: null,
    },
    // ── Sorting ──────────────────────────────────────────────────────────────
    {
      id: 'sort_timsort', category: 'Sorting', difficulty: 'basic',
      question: 'What sorting algorithm does Python\'s built-in `sorted()` and `list.sort()` use?',
      options: ['Quicksort','Mergesort','Timsort','Heapsort','Bubble sort','Insertion sort'],
      correctIndices: [2],
      explanation: 'Python uses Timsort — a hybrid stable algorithm derived from merge sort and insertion sort. It has O(n log n) worst case and O(n) best case.',
      nanoTutorial: '## Timsort\n\n```python\n# Built-in sort — uses Timsort\nmy_list = [3, 1, 4, 1, 5, 9, 2, 6]\nmy_list.sort()          # in-place, stable\nsorted_copy = sorted(my_list)  # returns new list\n\n# Key functions\nwords = ["banana", "apple", "cherry"]\nwords.sort(key=len)     # sort by length\nwords.sort(key=str.lower)  # case-insensitive\n```',
    },
    {
      id: 'sort_stable', category: 'Sorting', difficulty: 'intermediate',
      question: 'Which statements about Python\'s sort are correct? (Select all that apply.)',
      options: [
        '`list.sort()` is a stable sort',
        '`sorted()` always returns a new list',
        '`list.sort()` can sort a tuple in-place',
        'The `key` parameter accepts a function applied to each element before comparing',
        '`sorted()` modifies the original list',
        'Stability means equal elements preserve their original order',
      ],
      correctIndices: [0, 1, 3, 5],
      explanation: 'Python\'s sort is stable — equal elements keep their original order. `sorted()` always returns a new list. `list.sort()` only works on lists. The `key` function is applied to each element for comparison.',
      nanoTutorial: null,
    },
    // ── Algorithms ───────────────────────────────────────────────────────────
    {
      id: 'algo_binary', category: 'Algorithms', difficulty: 'basic',
      question: 'What is the time complexity of binary search on a sorted list of n elements?',
      options: ['O(1)','O(log n)','O(n)','O(n log n)','O(n²)','O(2ⁿ)'],
      correctIndices: [1],
      explanation: 'Binary search halves the search space on each step, giving O(log n) time complexity. It requires the list to be sorted.',
      nanoTutorial: '## Binary Search\n\n```python\nimport bisect\n\n# Python stdlib — bisect module\nnums = [1, 3, 5, 7, 9, 11]\npos = bisect.bisect_left(nums, 7)   # returns 3\n\n# Manual implementation\ndef binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n```',
    },
    {
      id: 'algo_complexity', category: 'Algorithms', difficulty: 'intermediate',
      question: 'Which algorithm has the best worst-case time complexity for sorting?',
      options: ['Bubble sort — O(n²)','Insertion sort — O(n²)','Selection sort — O(n²)','Merge sort — O(n log n)','Quicksort — O(n²) worst case','Counting sort — O(n) but limited to integers'],
      correctIndices: [3],
      explanation: 'Merge sort guarantees O(n log n) in all cases. Quicksort is O(n log n) average but degrades to O(n²) worst case. Counting sort is O(n) but only works for bounded integers.',
      nanoTutorial: null,
    },
    // ── Trees ────────────────────────────────────────────────────────────────
    {
      id: 'tree_bst', category: 'Trees', difficulty: 'basic',
      question: 'In a binary search tree (BST), which is always true for any node N?',
      options: [
        'All nodes in N\'s left subtree have values less than N',
        'All nodes in N\'s right subtree have values less than N',
        'N has exactly two children',
        'The tree is always balanced',
        'All nodes in N\'s left subtree have values greater than N',
        'The left child is always smaller than the right child',
      ],
      correctIndices: [0],
      explanation: 'In a BST, all values in the left subtree are less than the node\'s value, and all values in the right subtree are greater. The tree is not required to be balanced or have two children.',
      nanoTutorial: '## Binary Search Tree\n\n```python\nclass Node:\n    def __init__(self, val):\n        self.val   = val\n        self.left  = None\n        self.right = None\n\nclass BST:\n    def insert(self, root, val):\n        if not root:\n            return Node(val)\n        if val < root.val:\n            root.left  = self.insert(root.left,  val)\n        else:\n            root.right = self.insert(root.right, val)\n        return root\n\n    def search(self, root, val):\n        if not root or root.val == val:\n            return root\n        if val < root.val:\n            return self.search(root.left,  val)\n        return self.search(root.right, val)\n```',
    },
    {
      id: 'tree_traversal', category: 'Trees', difficulty: 'intermediate',
      question: 'Which tree traversal visits nodes in Left → Root → Right order?',
      options: ['Pre-order','In-order','Post-order','Level-order (BFS)','Reverse in-order','Depth-first post'],
      correctIndices: [1],
      explanation: 'In-order traversal visits Left subtree → Root → Right subtree. For a BST, in-order traversal produces values in sorted (ascending) order.',
      nanoTutorial: null,
    },
  ];
}

export function pickFromDemo(settings) {
  const bank   = getDemoBank();
  const catSet = new Set((settings.categories || []).map(String));
  const diff   = String(settings.difficulty || 'basic');
  let filtered = bank.filter(q => catSet.has(q.category) && q.difficulty === diff);
  if (!filtered.length) filtered = bank.filter(q => catSet.has(q.category));
  if (!filtered.length) filtered = bank.slice();
  const desired = Math.max(1, Math.min(50, Number(settings.questionCount) || 10));
  return shuffle(filtered).slice(0, Math.min(desired, filtered.length));
}
