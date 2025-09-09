export class CreateUserDto {
  display_name: string;
  email: string;
  role: string;
  contactNumber?: string;
  azureId?: string;
}
