# User Credentials

The following are the user credentials for accessing the system:

## User Details:

- **Email**: george@mail.com
- **Password**: george123  

## Admin User Details:

- **Email**: admin@mail.com
- **Password**: admin123  

## Usage:
- Login with the email `george@mail.com`.
- The password is used for authentication, which is securely hashed in the database.

## CRUD functionalities:

- Admin and non-admin users can add, edit and delete own blog post.
- Admin users can delete all users post but can not edit others blog Post except own post.
- Non-admin users can not delete or edit others Post.
- non-logged in / authenticated users can view all and single blog post but can not see three dots (for edit and delete post) and can not comment unless logged-in.