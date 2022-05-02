import { ELEMENT_ID } from 'src/constants';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function generateContainer(parent: Element, uniqueKey: string) {
  if (!parent) {
    return;
  }

  const id = ELEMENT_ID.CONTAINER + `-${uniqueKey}`;
  const curContainer = document.getElementById(id) as HTMLDivElement;

  const container = document.createElement('div');
  container.id = id;

  return {
    base() {
      if (curContainer) {
        return curContainer;
      }

      return container;
    },
    tooltip() {
      if (curContainer) {
        return curContainer;
      }

      const tooltipWidth = parent.getBoundingClientRect().width;
      const minContainerWidth = 350;

      container.className = 'relative w-auto';
      container.style.minWidth = tooltipWidth > minContainerWidth
        ? `${tooltipWidth}px`
        : `${minContainerWidth}px`;

      parent.appendChild(container);

      return container;
    },
  };
}

export default generateContainer;
