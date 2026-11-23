import * as i from 'types';
import React from 'react';
import dayjs from 'dayjs';
import cn from 'classnames';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useQuery } from '@tanstack/react-query';

import LoadingSvg from 'static/loading.svg';
// import WarningSvg from 'static/exclamation-circle-regular.svg';
import { ELEMENT_ID } from 'src/constants';
import useItemFetcher from 'hooks/useItemFetcher';
import useStorageQuery from 'hooks/useStorageQuery';

import { SellPrice } from './SellPrice';
import { TooltipBody } from './TooltipBody';
import { useRealm } from 'hooks/useRealm';

dayjs.extend(relativeTime);

/** Hours after which TSM data is considered stale (realm data updates every few hours, region data daily) */
const STALE_REALM_HOURS = 6;
const STALE_REGION_HOURS = 36;

function formatSoldPerDay(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: value < 10 ? 2 : 0 });
}

/** @TODO */
/**
 * x fix new item format
 * - add tooltip with text to add your server with a link to the form
 */

const Tooltip: React.FC<Props> = (props) => {
  const { data: user } = useStorageQuery('user');
  const { error, notFound, isFetching, isLoading, item, refetch } = useItemFetcher(props.itemId);
  const { activeRealm } = useRealm();
  const { data: lastUpdated } = useQuery({
    queryKey: ['tooltip', props.itemId, item?.updatedAt],
    queryFn: async () => {
      if (!item?.stats.lastUpdated) {
        return {
          hours: -1,
          text: 'N/A',
        };
      }

      const time = dayjs(item.stats.lastUpdated);

      return {
        hours: Math.abs(time.diff(dayjs(), 'hour')),
        text: time.fromNow(),
      };
    },
    enabled: !!item,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });

  if (!user?.realms) {
    return null;
  }

  /** @TODO Show link to change realm, let user know to set realm */

  if (!activeRealm) {
    return null;
  }

  const current = item?.stats?.current;
  const hasData = !!item?.regional || !!(current?.marketValue || current?.minBuyout);
  const regionHours = item?.regional?.lastUpdated
    ? Math.abs(dayjs(item.regional.lastUpdated).diff(dayjs(), 'hour'))
    : undefined;
  const errorStr = `Error: ${error || 'Something went wrong. Try again later.'}`;

  return (
    <TooltipBody
      id={ELEMENT_ID.TOOLTIP}
      header={
        <>
          {lastUpdated && (
            <div className="whtt-sellprice auc-mb-2">
              Last updated:&nbsp;
              <span
                className={cn({
                  q2: lastUpdated.hours < STALE_REALM_HOURS,
                  q10: lastUpdated.hours >= STALE_REALM_HOURS,
                })}
              >
                {lastUpdated.text}
              </span>
            </div>
          )}
        </>
      }
    >
      {item ? (
        <tr className="auc-block auc-w-full">
          <td className="auc-block auc-w-full">
            {!hasData ? (
              'No TSM data for this item.'
            ) : (
              <>
                <SellPrice
                  heading="Market Value"
                  amount={props.amount}
                  value={item.stats.current.marketValue}
                />
                <SellPrice
                  heading="Historical Value"
                  amount={props.amount}
                  value={item.stats.current.historicalValue}
                />
                <SellPrice
                  heading="Minimum Buyout"
                  amount={props.amount}
                  value={item.stats.current.minBuyout}
                />
                {item.regional && (
                  <>
                    <SellPrice
                      heading="Sale rate (region)"
                      value={String(item.regional.saleRate)}
                    />
                    <SellPrice
                      heading="Sold/day (region)"
                      value={formatSoldPerDay(item.regional.soldPerDay)}
                    />
                    {regionHours != null && (
                      <div className="whtt-sellprice auc-mt-1">
                        Region data updated:&nbsp;
                        <span
                          className={cn({
                            q2: regionHours < STALE_REGION_HOURS,
                            q10: regionHours >= STALE_REGION_HOURS,
                          })}
                        >
                          {dayjs(item.regional.lastUpdated).fromNow()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Only show this loading indicator if we can show a cached item */}
            {item && (isLoading || isFetching) ? (
              <div className="auc-mt-2 auc-flex">
                {/* @ts-ignore */}
                <LoadingSvg className="auc-mr-1 auc-inline-block auc-w-4" />
                Fetching latest price info...
              </div>
            ) : null}
          </td>
        </tr>
      ) : null}
      {(!item || !item) && (isLoading || isFetching) ? (
        <tr>
          <td>
            {/* @ts-ignore */}
            <LoadingSvg />
          </td>
        </tr>
      ) : null}
      {notFound && !item ? (
        <tr>
          <td>
            <div className="auc-mt-2 auc-flex">No TSM data for this item.</div>
          </td>
        </tr>
      ) : null}
      {error && !notFound && !item ? (
        <tr>
          <td>
            <div className="auc-mt-2 auc-flex auc-text-red-500">{errorStr}</div>
          </td>
        </tr>
      ) : null}
      {/* {warning ? (
                  <tr>
                    <td>
                      <div className="auc-mt-1">
                        <WarningSvg className="auc-h-3" />
                        {warning}
                      </div>
                    </td>
                  </tr>
                ) : null} */}
      <tr>
        <td>
          <div className="auc-mt-2 auc-text-[10px]">
            Pricing data from{' '}
            <a
              href="https://tradeskillmaster.com"
              target="_blank"
              rel="noopener noreferrer"
              className="q"
            >
              TradeSkillMaster
            </a>
          </div>
          {typeof props.children === 'function'
            ? props.children({
                error: !!error && !notFound,
                item,
                loading: isLoading || isFetching,
                getItem: refetch,
              })
            : props.children}
        </td>
      </tr>
    </TooltipBody>
  );
};

Tooltip.defaultProps = {
  amount: 1,
};

interface ChildrenFuncArgs {
  error: boolean;
  loading: boolean;
  item: i.MaybeAnyItem;
  getItem: i.ItemRefetchFn;
}

interface Props {
  itemId: number;
  amount?: number;
  children: null | JSX.Element | ((args: ChildrenFuncArgs) => JSX.Element | null);
}

export default Tooltip;
