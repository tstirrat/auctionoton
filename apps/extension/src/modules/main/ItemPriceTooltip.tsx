import * as React from 'react';

import ExternalLinkSvg from 'static/external-link.svg';
import RedoSvg from 'static/redo-solid.svg';
import { useAuctionHouse } from 'hooks/useAuctionHouse';
import { useWowhead } from 'hooks/useWowhead';
import { buildItemUrl } from 'utils/tsmCsv';
import Tooltip from './tooltip';

type Props = {
  itemId: number;
};

export const ItemPriceTooltip = (props: Props) => {
  const { version } = useWowhead();
  const auctionHouse = useAuctionHouse();
  const tsmUrl =
    auctionHouse && buildItemUrl(version, auctionHouse.region, auctionHouse.slug, props.itemId);

  return (
    <Tooltip itemId={props.itemId}>
      {({ error, loading, item, getItem }) => {
        return (
          <div className="auc-mt-2">
            {!loading && error && !item && (
              <div className="auc-mb-2">
                <button
                  className="btn btn-small auc-btn"
                  onClick={() => getItem()}
                  title="Try loading item data again for Auctionoton"
                >
                  <RedoSvg className="auc-h-2 auc-pr-1" />
                  <span>Try again</span>
                </button>
              </div>
            )}
            {tsmUrl && item && 'stats' in item && (
              <a
                href={tsmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="q auc-flex auc-place-items-center auc-gap-1"
              >
                More information on TradeSkillMaster <ExternalLinkSvg />
              </a>
            )}
          </div>
        );
      }}
    </Tooltip>
  );
};
