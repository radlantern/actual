// @ts-strict-ignore
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { addNotification } from 'loot-core/client/notifications/notificationsSlice';
import { signOut } from 'loot-core/client/users/usersSlice';
import { send } from 'loot-core/platform/client/fetch';
import { getUserAccessErrors } from 'loot-core/shared/errors';
import { type UserAvailable } from 'loot-core/types/models';

import { useMetadataPref } from '../../../hooks/useMetadataPref';
import { useDispatch } from '../../../redux';
import { Checkbox } from '../../forms';
import { Row, Cell } from '../../table';

type UserAccessProps = {
  access: UserAvailable;
  hovered?: boolean;
  onHover?: (id: string | null) => void;
};

export const UserAccessRow = memo(
  ({ access, hovered, onHover }: UserAccessProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const backgroundFocus = hovered;
    const [marked, setMarked] = useState(
      access.owner === 1 || access.haveAccess === 1,
    );
    const [cloudFileId] = useMetadataPref('cloudFileId');

    const handleAccessToggle = async () => {
      const newValue = !marked;
      if (newValue) {
        const { error } = await send('access-add', {
          fileId: cloudFileId as string,
          userId: access.userId,
        });

        if (error) {
          handleError(error);
        }
      } else {
        const result = await send('access-delete-all', {
          fileId: cloudFileId as string,
          ids: [access.userId],
        });

        if ('someDeletionsFailed' in result && result.someDeletionsFailed) {
          dispatch(
            addNotification({
              notification: {
                type: 'error',
                title: t('Access Revocation Incomplete'),
                message: t(
                  'Some access permissions were not revoked successfully.',
                ),
                sticky: true,
              },
            }),
          );
        }
      }
      setMarked(newValue);
    };

    const handleError = (error: string) => {
      if (error === 'token-expired') {
        dispatch(
          addNotification({
            notification: {
              type: 'error',
              id: 'login-expired',
              title: t('Login expired'),
              sticky: true,
              message: getUserAccessErrors(error),
              button: {
                title: t('Go to login'),
                action: () => {
                  dispatch(signOut());
                },
              },
            },
          }),
        );
      } else {
        dispatch(
          addNotification({
            notification: {
              type: 'error',
              title: t('Something happened while editing access'),
              sticky: true,
              message: getUserAccessErrors(error),
            },
          }),
        );
      }
    };

    return (
      <Row
        height="auto"
        style={{
          fontSize: 13,
          backgroundColor: backgroundFocus
            ? theme.tableRowBackgroundHover
            : theme.tableBackground,
        }}
        collapsed={true}
        onMouseEnter={() => onHover && onHover(access.userId)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        <Cell
          width={100}
          plain
          style={{ padding: '0 15px', paddingLeft: 5, alignItems: 'center' }}
        >
          <Checkbox
            defaultChecked={marked}
            disabled={access.owner === 1}
            onClick={handleAccessToggle}
          />
        </Cell>
        <Cell
          name="displayName"
          width="flex"
          plain
          style={{ color: theme.tableText }}
        >
          <View
            style={{
              alignSelf: 'flex-start',
              padding: '3px 5px',
            }}
          >
            <span>{access.displayName ?? access.userName}</span>
          </View>
        </Cell>
        <Cell
          name="displayName"
          width={100}
          plain
          style={{ color: theme.tableText }}
        >
          <View
            style={{ padding: '0 15px', paddingLeft: 5, alignItems: 'center' }}
          >
            <Checkbox
              checked={access.owner === 1}
              disabled={access.owner === 1}
            />
          </View>
        </Cell>
      </Row>
    );
  },
);

UserAccessRow.displayName = 'UserRow';
