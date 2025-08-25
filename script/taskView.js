const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

const QUERY_FOCUS_NODE = 'task-node[data-focused]'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.deleteTree.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focusTree.bind(this))
    this.addEventListener(EVENT_EDIT, this.render.bind(this))
    this.addEventListener(EVENT_MENU, this.showMenu.bind(this))
    this.addEventListener(EVENT_EXPAND, this.hideMenu.bind(this))
  }

  deleteTree({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  focusTree(event) {
    const initialTask = event.target
    // focus initial task
    initialTask.focus()
    // show focus modal
    this.querySelector('dialog').showFocus(initialTask)
    // custom scroll into view, places the focused task slightly above center
    const taskContainer = initialTask.select('div').getBoundingClientRect()
    const containerY = taskContainer.top + window.pageYOffset
    const middle = containerY - window.innerHeight / 2 + 200
    window.scrollTo(0, middle)
  }

  hideMenu(event) {
    event.stopPropagation()
    this.querySelector('menu').hide()
  }

  getNode(task) {
    if (!task) {
      // if no task, return the focused task
      return this.querySelector(QUERY_FOCUS_NODE)
    }

    const taskId = task.id
    const taskPath = task.path.toString()

    let node = null
    if (taskId) {
      node = this.querySelector(`task-node[data-id="${taskId}"]`)
    } else {
      node = this.querySelector(`task-node[data-path="${taskPath}"]`)
    }

    return node
  }

  render({ detail, target }) {
    const task = detail.task
    const treeNode = this.renderTree(task)

    // task base events without node are to be appended directly
    // TODO?: find an abstraction to consolidate this logic
    if (task.id && !detail?.node && target.tagName === TAG_BASE.toUpperCase()) {
      // append root tasks to task-base
      target.appendChild(treeNode)
      // TODO: scroll adding root into view (requires more info from event?)
      // scenario: there is a lot of tasks and you add a new one, it should scroll into view
      // return treeNode.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // branching subtask
    treeNode.setAttribute('slot', NAME_TREE)
    // replace node with updated node
    detail.node.replaceWith(treeNode)
  }

  renderSelect(task) {
    const taskState = document.createElement('select')
    taskState.setAttribute('slot', NAME_STATE)
    // let currentState = ''
    task.data.states.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state.toUpperCase()
      // set current state
      if (index === task.state) {
        // currentState = state
        option.setAttribute('selected', '')
        taskState.value = index
      }
      taskState.appendChild(option)
    })
    // set class to current state name
    // taskState.classList.add(currentState)
    return taskState
  }

  renderTree(task) {
    const taskNode = document.createElement(TAG_NODE)
    taskNode.init(task)

    const container = taskNode.shadowRoot.querySelector('div')

    // set the task path
    taskNode.setAttribute('data-path', task.path)
    if (task.id) {
      // only root tasks have id
      taskNode.setAttribute('data-id', task.id)
    }

    // fields
    if (taskNode.shadowRoot.querySelector(`slot[name="${NAME_NAME}"]`)) {
      const taskName = document.createElement(TAG_FIELD)
      taskName.setAttribute('slot', NAME_NAME)
      taskName.textContent = task.name
      taskNode.appendChild(taskName)
    }

    if (!task.meta.editing) {
      if (task.note && task.note.length) {
        taskNode.shadowRoot
          .querySelector(`[part="${NAME_NOTE}"]`)
          .setAttribute('data-note', task.note)
      } else {
        taskNode.shadowRoot.querySelector(`[part="${NAME_NOTE}"]`).remove()
      }
    }

    if (
      taskNode.shadowRoot.querySelector(`slot[name="${NAME_NOTE}"]`) &&
      task.note &&
      task.note.length
    ) {
      const taskNote = document.createElement(TAG_FIELD)
      taskNote.setAttribute('slot', NAME_NOTE)
      taskNote.textContent = task.note
      taskNode.appendChild(taskNote)
    }

    if (task.meta.editing) {
      const taskState = this.renderSelect(task, taskNode)
      taskNode.appendChild(taskState)
    }
    const currentState = task.data.states[task.state].toLowerCase()

    // refresh menu task node
    const menu = this.querySelector('menu')
    if (menu.node?.equals(taskNode)) {
      menu.node = taskNode
    }

    // state class and attributes on container
    container.classList.add(currentState)

    if (task.meta.focused) {
      taskNode.setAttribute('data-focused', '')
      container.classList.add('focused')
    }

    // leaf node
    if (!task.tree.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch node
    container.classList.add(CLASS_BRANCH)

    const treeTitleSlot = taskNode.shadowRoot.querySelector(`slot[name="${NAME_TITLE_TREE}"]`)
    if (treeTitleSlot) {
      const treeLength = task.tree.length
      const treeLabel = document.createElement(TAG_LABEL)
      treeLabel.setAttribute('slot', NAME_TITLE_TREE)
      treeLabel.textContent = `${treeTitleSlot.getAttribute('data-text')} (${treeLength})`
      taskNode.appendChild(treeLabel)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    for (const sub in task.tree) {
      const subTask = this.renderTree(task.tree[sub])
      subTask.setAttribute('slot', NAME_TREE)

      taskNode.appendChild(subTask)
    }

    return taskNode
  }

  showMenu(event) {
    // const task = event.detail.task
    // const node = event.detail.node
    const menu = this.querySelector('menu')
    event.stopPropagation()

    menu.show(event)
  }
}
