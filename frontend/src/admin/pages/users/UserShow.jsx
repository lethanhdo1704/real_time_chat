import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
} from 'react-admin';

const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="nickname" />
      <EmailField source="email" />
      <TextField source="role" />
      <TextField source="status" />
      <DateField source="createdAt" />
      <DateField source="lastSeen" />
    </SimpleShowLayout>
  </Show>
);

export default UserShow;
