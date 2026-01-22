// frontend/src/admin/AdminApp.jsx
import { Admin, Resource } from 'react-admin';
import authProvider from './auth/authProvider';
import dataProvider from './data/dataProvider';

import Login from './auth/Login';
import UserList from './pages/users/UserList';
import UserShow from './pages/users/UserShow';

const AppAdmin = () => {
  return (
    <Admin
      basename="/admin"
      loginPage={Login}
      authProvider={authProvider}
      dataProvider={dataProvider}
      requireAuth
    >
      <Resource
        name="users"
        list={UserList}
        show={UserShow}
      />
    </Admin>
  );
};

export default AppAdmin;
