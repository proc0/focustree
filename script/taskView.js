class TaskView extends TaskControl {
  constructor() {
    super()
    this.addEventListener(EVENT_RENDER, this.renderBranch.bind(this))
    this.addEventListener(EVENT_REROOT, this.renderRoot.bind(this))
    this.addEventListener(EVENT_REFRESH, this.refresh.bind(this))
    this.addEventListener(EVENT_DELETE, this.deleteRoot.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focusTree.bind(this))
    this.addEventListener(EVENT_EDIT, this.renderBranch.bind(this))
    this.addEventListener(EVENT_MENU, this.showMenu.bind(this))
    this.addEventListener(EVENT_EXPAND, this.hideMenu.bind(this))
    this.bindDragEvents()
  }

  clear() {
    this.querySelectorAll(TAG_NODE).forEach((node) => {
      node.remove()
    })
  }

  deleteRoot({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  focusTree(event) {
    const node = event.target

    node.focus()
    // show focus modal
    this.querySelector('dialog').showFocus(node)

    const OFFSET = 200
    // custom scroll into view, places the focused task slightly above center
    const nodeBounds = node.select('div').getBoundingClientRect()
    const nodeTop = nodeBounds.top + window.pageYOffset
    const pageOffset = nodeTop - window.innerHeight / 2 + OFFSET
    window.scrollTo(0, pageOffset)
  }

  hideMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').hide()
  }

  init() {
    // called by base to initialize references
    this.base = this.querySelector(TAG_BASE)
    this.menu = this.querySelector('menu')
  }

  refresh({ detail }) {
    const tasks = detail.tasks

    tasks.sort((a, b) => {
      return a.path[0] > b.path[0] ? 1 : -1
    })

    tasks.forEach((task) => {
      const treeNode = this.renderTree(task)
      this.base.appendChild(treeNode)
    })
  }

  renderBranch({ detail }) {
    const task = detail.task
    const treeNode = this.renderTree(task)
    // branch rendering
    treeNode.setAttribute('slot', NAME_TREE)
    // replace node with updated node
    detail.node.replaceWith(treeNode)
  }

  renderRoot({ detail, target }) {
    const task = detail.task
    const treeNode = this.renderTree(task)
    target.appendChild(treeNode)

    // const currentTasks = target.querySelectorAll(TAG_NODE)
    // if (!currentTasks.length) {
    //   return
    // }
    // let beforeNode = null
    // currentTasks.forEach((node, index) => {
    //   if (task.path[0] > index && !beforeNode) {
    //     beforeNode = node
    //   }
    // })
    // beforeNode.insertAdjacentElement('afterend', treeNode)
  }

  renderSelect(task) {
    const taskState = document.createElement('select')
    taskState.setAttribute('slot', NAME_STATE)
    task.data.states.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state.toUpperCase()
      if (index === task.state) {
        option.setAttribute('selected', '')
        taskState.value = index
        // set class to current state name
        taskState.classList.add(state)
      }
      taskState.appendChild(option)
    })
    return taskState
  }

  renderTree(task) {
    const taskNode = document.createElement(TAG_NODE).init(task)
    const container = taskNode.shadowRoot.querySelector('div')

    // metadata
    if (task.id) {
      // only root tasks have id
      taskNode.setAttribute(DATA_ID, task.id)
    }
    taskNode.setAttribute(DATA_PATH, task.path)
    taskNode.setAttribute('draggable', 'true')

    // task name
    if (taskNode.selectName(NAME_NAME)) {
      const taskName = document.createElement(TAG_FIELD)
      taskName.setAttribute('slot', NAME_NAME)
      const treeLength = task.tree.length
      // subtask number
      if (task.meta.editing || !treeLength) {
        taskName.textContent = task.name
      } else {
        taskName.textContent = `${task.name} (${treeLength})`
      }
      // note tooltip
      if (task.note.length) {
        taskName.setAttribute('title', task.note)
      }
      taskNode.appendChild(taskName)
    }

    // edit mode
    if (task.meta.editing) {
      // task note
      if (task.note.length) {
        const taskNote = document.createElement(TAG_FIELD)
        taskNote.setAttribute('slot', NAME_NOTE)
        taskNote.textContent = task.note
        taskNode.appendChild(taskNote)
      }
      // task state
      const taskState = this.renderSelect(task, taskNode)
      taskNode.appendChild(taskState)
      // add edit class
      container.classList.add(CLASS_EDIT)
    }

    // state class and attributes on container
    const currentState = task.data.states[task.state].toLowerCase()
    container.classList.add(currentState)

    // focus mode
    if (task.meta.focused) {
      taskNode.setAttribute(DATA_FOCUS, '')
      container.classList.add(CLASS_FOCUS)
    }

    // refresh menu task node
    const menu = this.querySelector('menu')
    if (menu.node?.equals(taskNode)) {
      menu.node = taskNode
    }

    // leaf node
    if (!task.tree.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch node
    container.classList.add(CLASS_BRANCH)

    // subtasks title header
    const treeTitleSlot = taskNode.selectName(NAME_TITLE_TREE)
    if (treeTitleSlot && task.meta.editing) {
      const treeLabel = document.createElement(TAG_LABEL)
      const treeLength = task.tree.length
      treeLabel.setAttribute('slot', NAME_TITLE_TREE)
      treeLabel.textContent = `${treeTitleSlot.getAttribute(DATA_TEXT)} (${treeLength})`
      taskNode.appendChild(treeLabel)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    for (let i = 0; i < task.tree.length; i++) {
      // recurse tree
      const subTree = this.renderTree(task.tree[i])
      subTree.setAttribute('slot', NAME_TREE)
      // append tree
      taskNode.appendChild(subTree)
    }

    return taskNode
  }

  showMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').show(event)
  }
}
