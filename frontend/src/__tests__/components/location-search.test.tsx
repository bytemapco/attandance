import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocationSearchBar from "@/components/location/LocationSearchBar";

const fetchSuggestions = vi.fn();
const fetchFields = vi.fn();

class FakeToken {}

const fakePlaces = {
  AutocompleteSessionToken: FakeToken,
  AutocompleteSuggestion: { fetchAutocompleteSuggestions: fetchSuggestions },
};

vi.mock("@vis.gl/react-google-maps", () => ({ useMapsLibrary: () => fakePlaces }));

function suggestion(placeId: string, main: string, secondary: string) {
  return {
    placePrediction: {
      placeId,
      text: { text: `${main}, ${secondary}` },
      mainText: { text: main },
      secondaryText: { text: secondary },
      toPlace: () => ({
        fetchFields,
        location: { lat: () => 18.4636, lng: () => 73.868 },
      }),
    },
  };
}

function type(text: string): void {
  fireEvent.change(screen.getByPlaceholderText(/search campus/i), { target: { value: text } });
}

describe("LocationSearchBar (Google Places)", () => {
  beforeEach(() => {
    fetchSuggestions.mockReset();
    fetchFields.mockReset().mockResolvedValue(undefined);
  });

  it("searches Google Places once the query is two characters long", async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [suggestion("p1", "Vidyasagar Institute", "Pune, Maharashtra")] });
    render(<LocationSearchBar onSelectLocation={vi.fn()} />);

    type("v");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(fetchSuggestions).not.toHaveBeenCalled();

    type("vidya");
    expect(await screen.findByText("Vidyasagar Institute")).toBeInTheDocument();
    expect(screen.getByText("Pune, Maharashtra")).toBeInTheDocument();
    expect(fetchSuggestions.mock.calls[0][0]).toMatchObject({ input: "vidya" });
  });

  it("returns the coordinates of the place that is picked", async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [suggestion("p1", "Vidyasagar Institute", "Pune")] });
    const onSelect = vi.fn();
    render(<LocationSearchBar onSelectLocation={onSelect} />);

    type("vidya");
    fireEvent.click(await screen.findByText("Vidyasagar Institute"));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(18.4636, 73.868, "Vidyasagar Institute"));
    expect(fetchFields).toHaveBeenCalledWith({ fields: ["location", "displayName"] });
  });

  it("shows no list when Google finds nothing", async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [] });
    render(<LocationSearchBar onSelectLocation={vi.fn()} />);

    type("zzzz");
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalled());

    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("does not move the pin when the place cannot be opened", async () => {
    fetchSuggestions.mockResolvedValue({ suggestions: [suggestion("p1", "Vidyasagar Institute", "Pune")] });
    fetchFields.mockRejectedValue(new Error("denied"));
    const onSelect = vi.fn();
    render(<LocationSearchBar onSelectLocation={onSelect} />);

    type("vidya");
    fireEvent.click(await screen.findByText("Vidyasagar Institute"));

    await waitFor(() => expect(fetchFields).toHaveBeenCalled());
    expect(onSelect).not.toHaveBeenCalled();
  });
});
