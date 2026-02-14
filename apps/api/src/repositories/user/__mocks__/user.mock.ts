import { User } from "../user.repository";

export const userMock: User = {
  id: "uuid",
  name: "Test User",
  email: "test@example.com",
  username: "testuser",
  createdAt: new Date(),
  bio: "This is a test bio.",
  pictureUrl: "https://example.com/testuser.jpg",
};
