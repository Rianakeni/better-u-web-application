import React, { useState } from "react";
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { Link } from "react-router-dom";
import { FaShoppingBasket } from "react-icons/fa";
const CustomNav = ({ basketItems, isLoggedIn, username }) => {
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
      <Navbar color="light" light expand="md" container>
        <NavbarBrand tag={Link} to="/" className="mr-auto">
          BETTER-U
        </NavbarBrand>
        <NavbarToggler onClick={toggle} className="mr-2" />
        <Collapse isOpen={isOpen} navbar>
          <Nav navbar>
            <UncontrolledDropdown nav inNavbar>
              {isLoggedIn ? (
                <>
                  <DropdownToggle nav caret>
                    {username} account
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
                      <NavLink tag={Link} to="/articles" onClick={toggle}>
                        Articles
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem>
                      <NavLink tag={Link} to="/profile" onClick={toggle}>
                        Profil
                      </NavLink>
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem>
                      <div onClick={toggle}>
                        {loginLogout}
                      </div>
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
