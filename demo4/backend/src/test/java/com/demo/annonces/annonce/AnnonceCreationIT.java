package com.demo.annonces.annonce;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** End to end on the in-memory H2: POST then GET, server-generated id and createdAt. */
@SpringBootTest
@AutoConfigureMockMvc
class AnnonceCreationIT {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsThenReadsBackIgnoringClientSuppliedIdAndDate() throws Exception {
        String body = """
                {
                  "id": "00000000-0000-0000-0000-000000000000",
                  "createdAt": "2000-01-01T00:00:00Z",
                  "title": "Canapé 3 places",
                  "category": "MAISON",
                  "description": "Canapé en tissu gris, très confortable, à venir chercher.",
                  "price": 120,
                  "city": "Nantes",
                  "postalCode": "44000"
                }
                """;

        String created = mockMvc.perform(post("/api/annonces").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String id = JsonPath.read(created, "$.id");
        String createdAt = JsonPath.read(created, "$.createdAt");
        org.assertj.core.api.Assertions.assertThat(id).isNotEqualTo("00000000-0000-0000-0000-000000000000");
        org.assertj.core.api.Assertions.assertThat(createdAt).isNotEqualTo("2000-01-01T00:00:00Z");

        mockMvc.perform(get("/api/annonces/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.title").value("Canapé 3 places"))
                .andExpect(jsonPath("$.category").value("MAISON"))
                .andExpect(jsonPath("$.price").value(120))
                .andExpect(jsonPath("$.createdAt").value(createdAt));
    }
}
