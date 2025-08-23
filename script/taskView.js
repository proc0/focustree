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
    initialTask.focusTask()
    // show focus modal
    this.querySelector('dialog').showFocus(initialTask)
  }

  getTaskNode(task) {
    // if no task, return the focused task
    if (!task) {
      return this.querySelector(QUERY_FOCUS_NODE)
    }

    const taskId = task.id
    const taskPath = task.path.toString()

    let taskNode = null
    if (taskId) {
      taskNode = this.querySelector(`task-node[data-id="${taskId}"]`)
    } else {
      taskNode = this.querySelector(`task-node[data-path="${taskPath}"]`)
    }

    return taskNode
  }

  render({ detail, target }) {
    const task = detail.task
    const treeNode = this.renderTree(task)

    // root add event does not have node to replace
    if (task.id && !detail?.node) {
      // append root tasks to task-base
      target.appendChild(treeNode)
      // TODO: scroll adding root into view (requires more info from event?)
      // return treeNode.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // branching subtask
    treeNode.setAttribute('slot', SLOT_TREE)
    // replace node with updated node
    detail.node.replaceWith(taskNode)
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
    if (taskNode.shadowRoot.querySelector('slot[name="task-name"]')) {
      const taskName = document.createElement(TAG_FIELD)
      taskName.setAttribute('slot', SLOT_NAME)
      taskName.textContent = task.name

      taskNode.appendChild(taskName)
    }

    if (!task.meta.editing) {
      if (task.note && task.note.length) {
        taskNode.shadowRoot.querySelector('[part="task-note"]').setAttribute('data-note', task.note)
      } else {
        taskNode.shadowRoot.querySelector('[part="task-note"]').remove()
      }
    }

    if (
      taskNode.shadowRoot.querySelector('slot[name="task-note"]') &&
      task.note &&
      task.note.length
    ) {
      const taskNote = document.createElement(TAG_FIELD)
      taskNote.setAttribute('slot', SLOT_NOTE)
      taskNote.textContent = task.note
      taskNode.appendChild(taskNote)
    }

    const taskState = document.createElement('select')
    taskState.setAttribute('slot', SLOT_STATE)
    let currentState = ''
    task.data.states.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state.toUpperCase()
      // set current state
      if (index === task.state) {
        currentState = state
        option.setAttribute('selected', '')
        taskState.value = index
      }
      taskState.appendChild(option)
    })
    // set class to current state name
    taskState.classList.add(currentState)
    taskNode.appendChild(taskState)

    // state class and attributes on container
    container.classList.add(currentState)
    if (task.meta.focused) {
      taskNode.setAttribute('data-focused', '')
      container.classList.add('focused')
    }

    // leaf
    if (!task.tree.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch
    container.classList.add(CLASS_BRANCH)

    const treeTitleSlot = taskNode.shadowRoot.querySelector(`slot[name="${SLOT_TITLE_TREE}"]`)
    if (treeTitleSlot) {
      const treeLength = task.tree.length
      const treeLabel = document.createElement(TAG_LABEL)
      treeLabel.setAttribute('slot', SLOT_TITLE_TREE)
      treeLabel.textContent = `${treeTitleSlot.getAttribute('data-text')} (${treeLength})`
      taskNode.appendChild(treeLabel)
    }

    for (const sub in task.tree) {
      const subTask = this.renderTree(task.tree[sub])
      subTask.setAttribute('slot', SLOT_TREE)

      taskNode.appendChild(subTask)
    }

    if (task.meta.opened) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
