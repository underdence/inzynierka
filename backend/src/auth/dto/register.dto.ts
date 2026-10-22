import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail.' })
  @MaxLength(254, {
    message: 'Adres e-mail może mieć maksymalnie 254 znaki.',
  })
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().normalize('NFC') : value,
  )
  @IsString({ message: 'Nick musi być tekstem.' })
  @Length(3, 20, {
    message: 'Nick musi mieć od 3 do 20 znaków.',
  })
  @Matches(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9_]+$/, {
    message: 'Nick może zawierać litery, polskie znaki, cyfry i podkreślenie.',
  })
  nickname!: string;

  @IsString({ message: 'Hasło musi być tekstem.' })
  @Length(8, 128, {
    message: 'Hasło musi mieć od 8 do 128 znaków.',
  })
  password!: string;
}
