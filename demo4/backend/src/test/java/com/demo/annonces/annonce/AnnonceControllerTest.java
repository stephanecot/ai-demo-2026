package com.demo.annonces.annonce;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AnnonceController.class)
class AnnonceControllerTest {

    private static final UUID ID = UUID.fromString("6f1c2c4e-8a1d-4f0e-9b3a-1d2e3f4a5b6c");
    private static final String VALID_BODY = """
            {
              "title": "Vélo de course",
              "category": "LOISIRS",
              "description": "Vélo de course en très bon état, peu servi.",
              "price": 350,
              "city": "Lyon",
              "postalCode": "69003"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnnonceService service;

    private static AnnonceResponse response() {
        return new AnnonceResponse(ID, "Vélo de course", Category.LOISIRS,
                "Vélo de course en très bon état, peu servi.", 350, "Lyon", "69003",
                Instant.parse("2026-09-15T10:00:00Z"));
    }

    @Test
    void createReturns201WithLocationAndBody() throws Exception {
        when(service.create(any())).thenReturn(response());

        mockMvc.perform(post("/api/annonces").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/annonces/" + ID))
                .andExpect(jsonPath("$.id").value(ID.toString()))
                .andExpect(jsonPath("$.title").value("Vélo de course"))
                .andExpect(jsonPath("$.category").value("LOISIRS"))
                .andExpect(jsonPath("$.price").value(350))
                .andExpect(jsonPath("$.city").value("Lyon"))
                .andExpect(jsonPath("$.postalCode").value("69003"))
                .andExpect(jsonPath("$.createdAt").value("2026-09-15T10:00:00Z"));
    }

    @ParameterizedTest(name = "{0} invalide -> 400 sur {0}")
    @CsvSource(delimiter = '|', value = {
            "title       | \"title\": \"Vélo\"",
            "title       | \"title\": \"\"",
            "description | \"description\": \"Trop court\"",
            "price       | \"price\": -1",
            "price       | \"price\": null",
            "city        | \"city\": \"  \"",
            "postalCode  | \"postalCode\": \"6900\"",
            "postalCode  | \"postalCode\": \"ABCDE\"",
            "category    | \"category\": null",
    })
    void createReturns400WithFieldErrorWhenRuleViolated(String field, String override) throws Exception {
        String body = VALID_BODY.replaceAll("\"" + field + "\": (\"[^\"]*\"|[^,\\n]+)", override);

        mockMvc.perform(post("/api/annonces").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors[*].field", hasItem(field)))
                .andExpect(jsonPath("$.errors[?(@.field == '" + field + "')].message").isNotEmpty());
        verifyNoInteractions(service);
    }

    @Test
    void createReturns400OnUnknownCategory() throws Exception {
        String body = VALID_BODY.replace("\"LOISIRS\"", "\"BATEAUX\"");

        mockMvc.perform(post("/api/annonces").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors[0].field").value("category"))
                .andExpect(jsonPath("$.errors[0].message").value("Catégorie inconnue"));
        verifyNoInteractions(service);
    }

    @Test
    void getReturns200WhenFound() throws Exception {
        when(service.findById(ID)).thenReturn(response());

        mockMvc.perform(get("/api/annonces/{id}", ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ID.toString()))
                .andExpect(jsonPath("$.title").value("Vélo de course"));
        verify(service).findById(ID);
    }

    @Test
    void getReturns404WhenUnknown() throws Exception {
        when(service.findById(ID)).thenThrow(new AnnonceNotFoundException(ID));

        mockMvc.perform(get("/api/annonces/{id}", ID))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").value("Annonce introuvable"));
    }
}
