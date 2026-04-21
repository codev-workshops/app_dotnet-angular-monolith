package com.ordermanager.auth.service;

import com.ordermanager.auth.dto.RoleDto;
import com.ordermanager.auth.model.Role;
import com.ordermanager.auth.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public RoleDto getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        return toDto(role);
    }

    @Transactional
    public RoleDto createRole(RoleDto roleDto) {
        if (roleRepository.existsByName(roleDto.getName())) {
            throw new RuntimeException("Role already exists: " + roleDto.getName());
        }

        Role role = new Role();
        role.setName(roleDto.getName());
        role.setDescription(roleDto.getDescription());

        Role saved = roleRepository.save(role);
        return toDto(saved);
    }

    @Transactional
    public RoleDto updateRole(Long id, RoleDto roleDto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        if (roleDto.getName() != null) {
            role.setName(roleDto.getName());
        }
        if (roleDto.getDescription() != null) {
            role.setDescription(roleDto.getDescription());
        }

        Role saved = roleRepository.save(role);
        return toDto(saved);
    }

    @Transactional
    public void deleteRole(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new RuntimeException("Role not found with id: " + id);
        }
        roleRepository.deleteById(id);
    }

    private RoleDto toDto(Role role) {
        RoleDto dto = new RoleDto();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        return dto;
    }
}
