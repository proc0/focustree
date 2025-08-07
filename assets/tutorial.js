// this is a sample JSON export and what gets loaded as the initial DB data.
// the only difference is that import/export will have a LIST [] of task trees.
const TUTORIAL = {
  'path': [0],
  'meta': {
    'opened': true,
  },
  'name': 'Focus Tree Tutorial',
  'note': 'Learn the basics.',
  'state': {
    'current': 0,
    'focused': false,
    'history': [],
    'options': ['ready', 'active', 'pause', 'done'],
  },
  'subs': [
    {
      'path': [0, 1],
      'meta': {
        'opened': false,
      },
      'name': 'Add a new root task.',
      'note': 'By clicking on the top left (+) icon.',
      'state': {
        'current': 0,
        'focused': false,
        'history': [],
        'options': ['ready', 'active', 'pause', 'done'],
      },
      'subs': [
        {
          'path': [0, 1, 0],
          'meta': {
            'opened': false,
          },
          'name': 'Edit the task name.',
          'note': 'By clicking on the (✎) icon next to the name.',
          'state': {
            'current': 0,
            'focused': false,
            'history': [],
            'options': ['ready', 'active', 'pause', 'done'],
          },
          'subs': [],
        },
        {
          'path': [0, 1, 1],
          'meta': {
            'opened': false,
          },
          'name': 'Edit the task description.',
          'note': 'By clicking on the (✎) icon next to the task subtitle.',
          'state': {
            'current': 0,
            'focused': false,
            'history': [],
            'options': ['ready', 'active', 'pause', 'done'],
          },
          'subs': [],
        },
      ],
    },
    {
      'path': [0, 1],
      'meta': {
        'opened': false,
      },
      'name': 'Focus on a task.',
      'note': 'By clicking the (👁) eyecon to the left of the state selection.',
      'state': {
        'current': 0,
        'focused': false,
        'history': [],
        'options': ['ready', 'active', 'pause', 'done'],
      },
      'subs': [
        {
          'path': [0, 1, 0],
          'meta': {
            'opened': false,
          },
          'name': 'Focus mode will guide you through the task tree.',
          'note': 'The task state will be automatically marked as "done".',
          'state': {
            'current': 0,
            'focused': false,
            'history': [],
            'options': ['ready', 'active', 'pause', 'done'],
          },
          'subs': [],
        },
        {
          'path': [0, 1, 1],
          'meta': {
            'opened': false,
          },
          'name': 'Reset the task states and sync all the subtasks.',
          'note': 'By selecting any state, and clicking on the (↴) icon to the right.',
          'state': {
            'current': 0,
            'focused': false,
            'history': [],
            'options': ['ready', 'active', 'pause', 'done'],
          },
          'subs': [],
        },
      ],
    },
    {
      'path': [0, 2],
      'meta': {
        'opened': false,
      },
      'name': 'Delete a task.',
      'note': 'By clicking on the (x) next to the task name.',
      'state': {
        'current': 0,
        'focused': false,
        'history': [],
        'options': ['ready', 'active', 'pause', 'done'],
      },
      'subs': [],
    },
    {
      'path': [0, 3],
      'meta': {
        'opened': false,
      },
      'name': 'Import/Export tasks.',
      'note':
        'Using the top right arrow icons. NOTE: Import does not overwrite tasks, this is WIP.',
      'state': {
        'current': 0,
        'focused': false,
        'history': [],
        'options': ['ready', 'active', 'pause', 'done'],
      },
      'subs': [],
    },
  ],
  'id': 1,
}
