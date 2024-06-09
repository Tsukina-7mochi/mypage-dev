import { css, html, LitElement } from 'lit';

type SlotchangeEvent = Event & {
  target: HTMLSlotElement;
};

const style_links = html`
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.5.2/css/all.css">
`;

class TechTags extends LitElement {
  static properties = {
    tags: { attribute: false },
  };
  static styles = css`
    slot {
      display: none;
    }
    :host {
      align-items: center;
    }
    i {
      vertical-align: middle;
    }
    span+span {
      margin-left: 0.5em;
    }
  `;

  declare tags: string[];

  constructor() {
    super();

    this.tags = [];
  }

  handleSlotchange(e: SlotchangeEvent) {
    const children = e.target.assignedNodes({ flatten: true });
    console.log(children);
    const tags = children
      .flatMap((v) => (v.textContent ?? '').split(',').map((s) => s.trim()))
      .filter((v) => v.length > 0);
    this.tags = tags;
  }

  render() {
    const tag_elements = this.tags.map((tag) => {
      return html`
        <span>${tag}</span>
      `;
    });
    console.log(tag_elements);

    return html`
      ${style_links}
      <i class="fa-solid fa-tags"></i>
      ${tag_elements}
      <slot @slotchange=${this.handleSlotchange}></slot>
    `;
  }
}

export default TechTags;
