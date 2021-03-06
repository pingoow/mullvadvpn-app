# How to contribute to the Mullvad VPN app

The Mullvad VPN app is open sourced for many reasons, but primarily we want to
* allow users to verify that our app functions as we claim it does, giving them the option to build
  it from source without having to trust our released binaries
* receive contributions from third parties.


## Filing issues

If you find a bug in the app's code, please report it on GitHub in the issue tracker. Please send
all other problems or questions (those not directly related to the app's development) to
[support@mullvad.net](mailto:support@mullvad.net). This includes connection issues, questions
regarding your account, and problems with the Mullvad VPN infrastructure or servers.


## Submitting changes

If you would like to contribute to the development of the Mullvad VPN app, please carefully read the
following sections first and then feel free to submit a pull request on GitHub.

While we appreciate your interest in helping us to improve Mullvad VPN, please understand that
choosing which submitted changes to merge is fully at our discretion, based upon our development
plans for the app.

### Copyright and ownership of contributed code and changes

Any code, binaries, tools, documentation, graphics, or any other material that you submit to this
project will be licensed under GPL 3.0. Submitting to this project means that you are the original
author of the entire contribution and grant us the full right to use, publish, change or remove
the entire, or part of, your contribution under the terms defined by the GPL 3.0 license at any
point in time.

### Toolchain versions

All Rust code must work on the latest stable release of Rust as well as the latest Mullvad beta
release. It should also work on nightly Rust, but this can, from time to time, be overlooked when
nightly is broken.

All JavaScript code must work with Node 8 and 9.

### Code formatting

All Rust code in this repository must always be formatted with the latest available version of
rustfmt (`rustfmt-nightly` at the moment). Please run `./format.sh` to automatically format
the entire repository.
