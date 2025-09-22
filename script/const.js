//placeholder
TUTORIAL = null

const NEW_NAME = 'New Task: Edit name.'

// more states can be added
const STATE_READY = 'ready'
const STATE_ACTIVE = 'active'
const STATE_PAUSE = 'pause'
const STATE_DONE = 'done'
const STATE_REJECT = 'reject'
// define states above and add them to the state list
const STATES = [STATE_READY, STATE_ACTIVE, STATE_PAUSE, STATE_DONE, STATE_REJECT]

// global events
const EVENT_RENDER = 'render'
const EVENT_RENDER_ROOT = 'render-root'
const EVENT_RENDER_BRANCH = 'render-branch'
const EVENT_UPDATE = 'update'
const EVENT_BRANCH = 'branch'
const EVENT_DELETE = 'delete'
const EVENT_EXPAND = 'expand'
const EVENT_STATUS = 'status'
const EVENT_FOCUS = 'focus'
const EVENT_SAVE = 'save'
const EVENT_MENU = 'menu'
const EVENT_SYNC = 'sync'
const EVENT_CLONE = 'clone'
const EVENT_EDIT = 'edit'
const EVENT_TREE_EDIT = 'tree-edit'
const EVENT_DRAG = 'drag'

// main menu
const ID_ROOT_ADD = 'root-add'
const ID_ROOT_IMPORT = 'root-import'
const ID_ROOT_EXPORT = 'root-export'
const ID_ROOT_MENU_TOGGLE = 'root-menu-toggle'
const ID_ROOT_SETTINGS = 'root-settings'
const ID_ROOT_INFO = 'root-info'
// custom html templates
const TEMPLATE_NODE = 'template-task'
const TEMPLATE_EDIT = 'template-edit'
const TEMPLATE_FOCUS = 'template-focus'
const TEMPLATE_MENU = 'template-menu'
const TEMPLATE_SETTINGS = 'template-settings'
// custom element tag names
const TAG_NODE = 'task-node'
const TAG_BASE = 'task-base'
const TAG_VIEW = 'task-view'
const TAG_FOCUS = 'task-focus'
const TAG_MENU = 'task-menu'
const TAG_SETTINGS = 'task-settings'
// html elements for slots
const TAG_FIELD = 'span'
const TAG_LABEL = 'span'

// slot names, should match html
const NAME_ADD = 'task-add'
const NAME_DELETE = 'task-delete'
const NAME_DONE = 'task-done'
const NAME_EDIT = 'task-edit'
const NAME_FOCUS = 'task-focus'
const NAME_MENU = 'task-menu'
const NAME_NAME = 'task-name'
const NAME_NOTE = 'task-note'
const NAME_PAUSE = 'task-pause'
const NAME_SAVE = 'task-save'
const NAME_STATE = 'task-state'
const NAME_SYNC = 'task-sync'
const NAME_CLONE = 'task-clone'
const NAME_TITLE_TREE = 'tree-title'
const NAME_TREE = 'task-tree'

// attribute names
const DATA_ID = 'data-id'
const DATA_FOCUS = 'data-focus'
const DATA_TEXT = 'data-text'
const DATA_PATH = 'data-path'
const DATA_THEME = 'data-theme'

// classes
const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'
const CLASS_FOCUS = 'focus'
const CLASS_EDIT = 'editing'
const CLASS_DRAGGING = 'dragging'
const CLASS_DRAG_NODE = 'drag-node'
const CLASS_DROP_ABOVE = 'drop-above'
const CLASS_DROP_OVER = 'drop-over'
const CLASS_DROP_BELOW = 'drop-below'
const CLASS_DROP_HOVER = 'drop-hover'
const CLASS_MENU_OPEN = 'menu-open'

// theme classes (should match html)
const THEME_ICON_BUTTON = 'icon-button'
const THEME_FIELD_INPUT = 'field-input'

const QUERY_ROOT_MENU = 'header > menu'
