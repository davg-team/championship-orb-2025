import click
from jwcrypto import jwk


# Генерация симметричных ключей
def generate_symmetric_key(alg: str) -> jwk.JWK:
    size = {"HS256": 256, "HS384": 384, "HS512": 512}.get(alg, 256)

    key = jwk.JWK.generate(kty="oct", size=size)
    key.alg = alg
    key.use = "enc"
    return key


# Генерация асимметричных ключей
def generate_asymmetric_key(alg: str) -> jwk.JWK:
    if alg == "RS256":
        key = jwk.JWK.generate(kty="RSA", size=2048)
    elif alg == "RS384":
        key = jwk.JWK.generate(kty="RSA", size=3072)
    elif alg == "RS512":
        key = jwk.JWK.generate(kty="RSA", size=4096)
    elif alg == "ES256":
        key = jwk.JWK.generate(kty="EC", crv="P-256")
    elif alg == "ES384":
        key = jwk.JWK.generate(kty="EC", crv="P-384")
    elif alg == "ES512":
        key = jwk.JWK.generate(kty="EC", crv="P-521")
    elif alg == "PS256":
        key = jwk.JWK.generate(kty="RSA", size=2048)
    else:
        raise ValueError(f"Unknown algorithm: {alg}")

    key.alg = alg
    key.use = "sig"
    return key


# Сохранение ключа в файл
def save_key_to_file(key: jwk.JWK, directory: str, file_name: str, private_key=True):
    pem_data = key.export_to_pem(private_key=private_key, password=None)
    file_path = f"{directory}/{file_name}"
    with open(file_path, "wb") as pem_file:
        pem_file.write(pem_data)
    click.echo(f"Key saved to {file_path}")


def save_key_to_file_symmetric(key: jwk.JWK, directory: str, file_name: str):
    pem_data = key.export_symmetric()
    file_path = f"{directory}/{file_name}"
    with open(file_path, "w") as pem_file:
        pem_file.write(pem_data)
    click.echo(f"Key saved to {file_path}")


# Вывод ключа в консоль
def print_key(key: jwk.JWK):
    pem_data = key.export_to_pem(private_key=True, password=None).decode("utf-8")
    click.echo(pem_data)


@click.group()
def cli():
    """CLI Tool for Generating Cryptographic Keys"""
    pass


@cli.command()
@click.option(
    "--algorithm",
    type=click.Choice(["HS256", "HS384", "HS512"]),
    required=True,
    help="Algorithm for the symmetric key",
)
@click.option("--output", type=click.Path(), help="Output directory to save the key")
@click.option(
    "--name", type=str, default="symmetric_key.pem", help="Name of the key file"
)
@click.option("--print", is_flag=True, help="Print the key to the console")
def generate_symmetric(algorithm, output, name, print):
    """Generate a symmetric key"""
    click.echo(f"Generating symmetric key with algorithm {algorithm}...")
    key = generate_symmetric_key(algorithm)

    if output:
        save_key_to_file_symmetric(key, output, name)

    if print:
        print_key(key)


@cli.command()
@click.option(
    "--algorithm",
    type=click.Choice(["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256"]),
    required=True,
    help="Algorithm for the asymmetric key",
)
@click.option("--output", type=click.Path(), help="Output directory to save the key")
@click.option(
    "--name", type=str, default="asymmetric_key.pem", help="Name of the key file"
)
@click.option("--print", is_flag=True, help="Print the key to the console")
def generate_asymmetric(algorithm, output, name, print):
    """Generate an asymmetric key"""
    click.echo(f"Generating asymmetric key with algorithm {algorithm}...")
    key = generate_asymmetric_key(algorithm)

    if output:
        save_key_to_file(key, output, name)

    if print:
        print_key(key)


@cli.command()
@click.option("--symmetric", is_flag=True, help="Generate all supported symmetric keys")
@click.option("--asymmetric", is_flag=True, help="Generate all supported asymmetric keys")
@click.option("--output", type=click.Path(), help="Output directory to save the keys")
@click.option("--print", is_flag=True, help="Print the keys to the console")
def generate_all(symmetric, asymmetric, output, print):
    """Generate all types of supported keys"""
    if symmetric:
        click.echo("Generating all symmetric keys...")
        for alg in ["HS256", "HS384", "HS512"]:
            key = generate_symmetric_key(alg)
            name = f"{alg}_key.pem"
            if output:
                save_key_to_file(key, output, name)
            if print:
                click.echo(f"\n{alg} key:")
                print_key(key)

    if asymmetric:
        click.echo("Generating all asymmetric keys...")
        for alg in ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256"]:
            key = generate_asymmetric_key(alg)
            name = f"{alg}_key.pem"
            if output:
                save_key_to_file(key, output, name)
            if print:
                click.echo(f"\n{alg} key:")
                print_key(key)


if __name__ == "__main__":
    cli()
