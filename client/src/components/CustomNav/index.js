import React, { useState } from "react";
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";
import { CgList } from "react-icons/cg";
const CustomNav = ({ isLoggedIn }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const loginLogout = isLoggedIn ? (
    <NavLink tag={Link} to="/logout">
      Logout
    </NavLink>
  ) : (
    <NavLink tag={Link} to="/login">
      Login
    </NavLink>
  );

  return (
    <div className="custom-nav">
      <Navbar color="#9bff98" light expand="md" container>
        <NavbarBrand tag={Link} to="/" className="mr-auto">
          <img
            src={logo}
            alt="BETTER-U"
            height={90} // atur tinggi logo
            loading="lazy"
            style={{ display: "block" }}
          />
        </NavbarBrand>
        <NavbarToggler onClick={toggle} className="mr-2" />
        <Collapse isOpen={isOpen} navbar>
          <Nav navbar>
            <UncontrolledDropdown nav inNavbar>
              {isLoggedIn ? (
                <>
                  <DropdownToggle nav caret>
                    <CgList size={35} />
                  </DropdownToggle>
                  <DropdownMenu end>
                    <DropdownItem>
                      <NavLink tag={Link} to="/dashboard" onClick={toggle}>
                        Dashboard
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem>
                      <NavLink tag={Link} to="/booking" onClick={toggle}>
                        Booking Janji
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem>
                      <NavLink tag={Link} to="/jadwal" onClick={toggle}>
                        Jadwal Anda
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem>
                      <NavLink tag={Link} to="/riwayat" onClick={toggle}>
                        Riwayat
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem>
                      <NavLink tag={Link} to="/profile" onClick={toggle}>
                        Profil
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem>
                      <div onClick={toggle}>{loginLogout}</div>
                    </DropdownItem>
                  </DropdownMenu>
                </>
              ) : (
                loginLogout
              )}
            </UncontrolledDropdown>
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
};

export default CustomNav;
