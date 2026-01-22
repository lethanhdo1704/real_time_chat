import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  ShowButton,
} from 'react-admin';

const UserList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="nickname" />
      <EmailField source="email" />
      <TextField source="role" />
      <TextField source="status" />
      <DateField source="createdAt" />
      <ShowButton />
    </Datagrid>
  </List>
);

export default UserList;
