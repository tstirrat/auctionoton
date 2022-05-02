import type * as i from 'types';
import 'typed-query-selector';
import React from 'react';
import ReactDOM from 'react-dom';

import getBodyElement from 'utils/getBodyElement';
import useIsClassicWowhead from 'hooks/useIsClassicWowhead';
import useGetItemFromPage from 'hooks/useGetItemFromPage';
import useStorageQuery from 'hooks/useStorageQuery';

import generateContainer from './generateContainer';


const CREATED_BY_SECTION_ID = 'tab-created-by-spell';
const CREATED_BY_SECTION_SELECTOR = `#${CREATED_BY_SECTION_ID} .listview-scroller-vertical`;


const CraftingCost = (): React.ReactPortal | null => {
  const isClassicWowhead = useIsClassicWowhead();
  const { item: pageItem, isAuctionableItem } = useGetItemFromPage();
  const { data: user } = useStorageQuery('user');
  const containerEl = React.useRef<HTMLDivElement | null>(
    document.querySelector(CREATED_BY_SECTION_SELECTOR) as HTMLDivElement,
  );

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const nodes = Array.from(mutation.addedNodes) as HTMLDivElement[];

        for (const node of nodes) {
          if (node.id.includes(CREATED_BY_SECTION_ID)) {
            // Generate and save a container
            const container = generateContainer(node, 'hover')?.base();

            if (container) {
              containerEl.current = container;
            }
          }
        }
      }
    });

    // Observe added/removed nodes to body and its children
    observer.observe(getBodyElement(), { childList: true });
  }, []);

  if (!containerEl.current || !pageItem) {
    return null;
  }

  return ReactDOM.createPortal(
    <>
      <div className="bg-wowhead-gray-500">Hello World!</div>
    </>,
    containerEl.current,
  );
};

export default CraftingCost;
