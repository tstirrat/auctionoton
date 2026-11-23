import 'typed-query-selector';
import * as i from 'types';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SubmitHandler, useForm } from 'react-hook-form';

import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from 'src/components/ui/select';
import { Button } from 'src/components/ui/button';
import useRealmsList from 'hooks/useRealmsList';
import useStorageQuery from 'hooks/useStorageQuery';
import asyncStorage from 'utils/asyncStorage';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'src/components/ui/form';
import {
  DEFAULT_FOREVER_FACTION,
  DEFAULT_FOREVER_REGION,
  DEFAULT_FOREVER_RULESET,
  buildAuctionHouseSlug,
  parseAuctionHouseSlug,
} from 'utils/realms';

interface FormInput {
  region: i.Regions;
  ruleset: string;
  faction: i.Factions;
}

const VERSION: i.GameVersion = 'forever';

// Create a client
const queryClient = new QueryClient();

export const RealmForm: React.FC = () => {
  const { data: user } = useStorageQuery('user');
  const userMutation = useMutation({ mutationFn: userMutateFn });
  const form = useForm<FormInput>({
    mode: 'onSubmit',
    defaultValues: {
      region: DEFAULT_FOREVER_REGION,
      ruleset: DEFAULT_FOREVER_RULESET,
      faction: capitalize(DEFAULT_FOREVER_FACTION),
    },
  });
  const watchRegion = form.watch('region');
  const rulesets = useRealmsList(watchRegion, VERSION);

  // Load saved realm into the form
  React.useEffect(() => {
    if (form.formState.isDirty || !user) {
      return;
    }

    const storedRealm = user.realms?.[VERSION];
    const parsed = storedRealm ? parseAuctionHouseSlug(storedRealm.slug) : null;

    if (storedRealm && parsed) {
      form.reset({
        region: storedRealm.region ?? user.region ?? DEFAULT_FOREVER_REGION,
        ruleset: parsed.ruleset,
        faction: capitalize(parsed.faction),
      });
    }
  }, [user]);

  // Pick a valid ruleset when the region changes (e.g. no roleplay rulesets in TW/KR)
  React.useEffect(() => {
    if (!rulesets.some((realm) => realm.ruleset === form.getValues('ruleset'))) {
      form.setValue('ruleset', rulesets[0]?.ruleset ?? DEFAULT_FOREVER_RULESET);
    }
  }, [watchRegion]);

  const onSubmit: SubmitHandler<FormInput> = async (data, e) => {
    e?.preventDefault();
    userMutation.mutate(data);
  };

  function userMutateFn(data: FormInput) {
    const realm = rulesets.find((realm) => realm.ruleset === data.ruleset);

    if (!realm) {
      throw Error('Invalid ruleset');
    }

    return asyncStorage.set('user', (draft) => {
      draft.region = data.region;
      draft.version = VERSION;
      draft.realms ||= {};
      draft.realms[VERSION] = {
        name: realm.name,
        slug: buildAuctionHouseSlug(
          data.ruleset,
          data.faction.toLowerCase() as 'horde' | 'alliance',
        ),
        region: data.region,
      };
      draft.faction = {
        ...user?.faction,
        [realm.name]: data.faction,
      };
    });
  }

  return (
    <Form {...form}>
      <form
        className="auc-mx-auto md:auc-max-w-md auc-space-y-6 auc-p-6 auc-w-full"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="auc-space-y-2 auc-text-center auc-gap-4 auc-flex auc-items-center md:auc-block">
          <img alt="Logo" src="static/icon.png" className="auc-mx-auto auc-hidden md:auc-block" />
          <img alt="Logo" src="static/icon-48.png" className="auc-block md:auc-hidden" />
          <h1 className="auc-text-lg md:auc-text-3xl auc-font-bold">Auctionoton</h1>
          <p className="auc-text-zinc-500 dark:auc-text-zinc-400 auc-hidden md:auc-block">
            Select your WoW Forever auction house to see prices on Wowhead
          </p>
        </div>
        <div className="auc-space-y-6 auc-w-full">
          <div>
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem className="auc-space-y-1">
                  <FormLabel>Region</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Select Region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="item-aligned">
                      <SelectItem value="us">North America</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="tw">Taiwan</SelectItem>
                      <SelectItem value="kr">Korea</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="ruleset"
              render={({ field }) => (
                <FormItem className="auc-space-y-1">
                  <FormLabel>Ruleset</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="ruleset">
                        <SelectValue placeholder="Select ruleset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="item-aligned">
                      {rulesets.map((realm) => (
                        <SelectItem key={realm.ruleset} value={realm.ruleset}>
                          {realm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="faction"
              render={({ field }) => (
                <FormItem className="auc-space-y-1">
                  <FormLabel>Faction</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="faction">
                        <SelectValue placeholder="Select faction" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="item-aligned">
                      <SelectItem value="Alliance">Alliance</SelectItem>
                      <SelectItem value="Horde">Horde</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button className="auc-w-full" type="submit">
            Save
          </Button>
          {userMutation.isSuccess && (
            <p className="auc-text-green-500 dark:auc-text-green-400">Saved!</p>
          )}
        </div>
      </form>
    </Form>
  );
};

function capitalize(faction: string): i.Factions {
  return (faction.charAt(0).toUpperCase() + faction.slice(1)) as i.Factions;
}

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <QueryClientProvider client={queryClient}>
      <RealmForm />
      <ReactQueryDevtools />
    </QueryClientProvider>,
  );
}
